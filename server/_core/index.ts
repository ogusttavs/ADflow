import "dotenv/config";
import express from "express";
import type { Request } from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { UNVERIFIED_ACCOUNT_MAX_AGE_MS } from "@shared/const";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { ENV } from "./env";
import { processAsaasWebhookPayload } from "./asaasWebhook";
import { processKiwifyWebhookPayload } from "./kiwifyWebhook";
import * as db from "../db";
import { serveStatic, setupVite } from "./vite";

function getTrpcProcedures(req: Request): Set<string> {
  const procedures = new Set<string>();
  const sourcePaths = [req.path, req.url, req.originalUrl];

  for (const sourcePath of sourcePaths) {
    const pathOnly = sourcePath.split("?")[0] ?? "";
    const normalized = pathOnly
      .replace(/^\/api\/trpc\/?/, "")
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");

    if (!normalized) continue;

    for (const procedure of normalized.split(",")) {
      const cleaned = procedure.trim();
      if (cleaned) procedures.add(cleaned);
    }
  }

  return procedures;
}

function hasTrpcProcedure(req: Request, procedure: string) {
  return getTrpcProcedures(req).has(procedure);
}

function getIncomingKiwifyToken(req: Request) {
  const headerCandidates = [
    "x-kiwify-token",
    "x-kiwify-webhook-token",
    "kiwify-webhook-token",
    "x-webhook-token",
    "webhook-token",
    "authorization",
  ];

  for (const headerName of headerCandidates) {
    const headerValue = String(req.header(headerName) ?? "").trim();
    if (!headerValue) continue;
    if (headerName === "authorization" && headerValue.toLowerCase().startsWith("bearer ")) {
      const bearerToken = headerValue.slice(7).trim();
      if (bearerToken) return bearerToken;
      continue;
    }
    return headerValue;
  }

  const bodyRecord =
    req.body && typeof req.body === "object" && !Array.isArray(req.body)
      ? (req.body as Record<string, unknown>)
      : null;
  if (bodyRecord) {
    const bodyTokenCandidates = [
      bodyRecord.token,
      bodyRecord.webhook_token,
      bodyRecord.webhookToken,
      bodyRecord.x_kiwify_token,
      bodyRecord.xKiwifyToken,
      typeof bodyRecord.data === "object" && bodyRecord.data
        ? (bodyRecord.data as Record<string, unknown>).token
        : null,
    ];

    for (const value of bodyTokenCandidates) {
      const normalized = String(value ?? "").trim();
      if (normalized) return normalized;
    }
  }

  return "";
}

function normalizeIp(rawValue: string) {
  const normalized = rawValue.trim();
  if (!normalized) return "";
  if (normalized.startsWith("::ffff:")) return normalized.slice(7);
  return normalized;
}

function parseAllowedIps(rawValue: string): Set<string> {
  const allowedIps = new Set<string>();
  for (const candidate of rawValue.split(",")) {
    const ip = normalizeIp(candidate);
    if (ip) allowedIps.add(ip);
  }
  return allowedIps;
}

function getIncomingRequestIp(req: Request) {
  const forwardedFor = String(req.header("x-forwarded-for") ?? "").trim();
  if (forwardedFor) {
    const firstHop = forwardedFor.split(",")[0] ?? "";
    const forwardedIp = normalizeIp(firstHop);
    if (forwardedIp) return forwardedIp;
  }
  return normalizeIp(req.ip ?? "");
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

function shouldUseInternalVite() {
  return process.env.NODE_ENV === "development" && process.env.DISABLE_INTERNAL_VITE !== "1";
}

async function startServer() {
  const databaseReady = await db.isDatabaseAvailable();
  if (!databaseReady) {
    const message =
      "Banco indisponível no startup. Configure DATABASE_URL e valide acesso ao MySQL.";

    if (ENV.isProduction) {
      throw new Error(message);
    }

    console.warn(`[Startup] ${message}`);
  }

  const app = express();
  const server = createServer(app);
  app.set("trust proxy", 1);

  const runExpiredUnverifiedCleanup = async () => {
    const cutoffDate = new Date(Date.now() - UNVERIFIED_ACCOUNT_MAX_AGE_MS);
    const deletedUsers = await db.deleteExpiredUnverifiedUsers(cutoffDate);
    if (deletedUsers > 0) {
      console.log(`[Auth] Deleted ${deletedUsers} expired unverified account(s)`);
    }
  };

  void runExpiredUnverifiedCleanup();
  const cleanupInterval = setInterval(() => {
    void runExpiredUnverifiedCleanup();
  }, 6 * 60 * 60 * 1000);
  cleanupInterval.unref();

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skip: req =>
      process.env.NODE_ENV !== "production" || !hasTrpcProcedure(req, "auth.login"),
    message: { error: "Muitas tentativas de login. Tente novamente em 15 minutos." },
  });

  const registerRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skip: req =>
      process.env.NODE_ENV !== "production" || !hasTrpcProcedure(req, "auth.register"),
    message: { error: "Muitas tentativas de cadastro. Tente novamente em 1 hora." },
  });

  const forgotPasswordRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    skip: req =>
      process.env.NODE_ENV !== "production" ||
      !hasTrpcProcedure(req, "auth.requestPasswordReset"),
    message: { error: "Muitas tentativas de recuperação. Tente novamente em 1 hora." },
  });

  const resetPasswordRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    skip: req =>
      process.env.NODE_ENV !== "production" || !hasTrpcProcedure(req, "auth.resetPassword"),
    message: { error: "Muitas tentativas de redefinição. Tente novamente em 1 hora." },
  });

  const resendVerificationRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skip: req =>
      process.env.NODE_ENV !== "production" || !hasTrpcProcedure(req, "auth.resendVerification"),
    message: { error: "Muitas tentativas de reenvio. Tente novamente em 1 hora." },
  });

  const requestVerificationRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skip: req =>
      process.env.NODE_ENV !== "production" ||
      !hasTrpcProcedure(req, "auth.requestEmailVerification"),
    message: { error: "Muitas tentativas de verificação. Tente novamente em 1 hora." },
  });

  const recoverEmailRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    skip: req =>
      process.env.NODE_ENV !== "production" || !hasTrpcProcedure(req, "auth.recoverEmailByTaxId"),
    message: { error: "Muitas tentativas de recuperação. Tente novamente em 1 hora." },
  });

  const globalApiRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV !== "production",
    message: { error: "Muitas requisições. Tente novamente em instantes." },
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.post("/api/webhooks/kiwify", async (req, res) => {
    const expectedToken = ENV.kiwifyWebhookToken.trim();
    const incomingToken = getIncomingKiwifyToken(req);
    const incomingIp = getIncomingRequestIp(req);
    const allowedIps = parseAllowedIps(ENV.kiwifyWebhookAllowedIps);

    if (!expectedToken) {
      console.error("[Kiwify webhook] Missing KIWIFY_WEBHOOK_TOKEN configuration");
      return res.status(503).json({ ok: false });
    }

    if (allowedIps.size === 0) {
      console.info(
        `[Kiwify webhook] Allowlist desativada. Origem recebida: (${incomingIp || "unknown"})`
      );
    }

    if (allowedIps.size > 0 && (!incomingIp || !allowedIps.has(incomingIp))) {
      console.warn(
        `[Kiwify webhook] Blocked request from non-allowed IP (${incomingIp || "unknown"})`
      );
      return res.status(401).json({ ok: false });
    }

    if (!incomingToken || incomingToken !== expectedToken) {
      console.warn(
        `[Kiwify webhook] Invalid token from IP (${incomingIp || "unknown"})`
      );
      return res.status(401).json({ ok: false });
    }

    try {
      const result = await processKiwifyWebhookPayload(req.body);
      return res.status(200).json(result);
    } catch (error) {
      console.error("[Kiwify webhook] Unexpected processing error", error);
      return res.status(200).json({ ok: true });
    }
  });

  app.post("/api/webhooks/asaas", async (req, res) => {
    const expectedToken = ENV.asaasWebhookToken.trim();
    const incomingToken = String(req.header("asaas-access-token") ?? "").trim();

    if (!expectedToken) {
      console.error("[Asaas webhook] Missing ASAAS_WEBHOOK_TOKEN configuration");
      return res.status(503).json({ ok: false });
    }

    if (!incomingToken || incomingToken !== expectedToken) {
      return res.status(401).json({ ok: false });
    }

    try {
      const result = await processAsaasWebhookPayload(req.body);
      return res.status(200).json(result);
    } catch (error) {
      console.error("[Asaas webhook] Unexpected processing error", error);
      return res.status(200).json({ ok: true });
    }
  });

  app.use("/api", globalApiRateLimiter);
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    loginRateLimiter,
    registerRateLimiter,
    forgotPasswordRateLimiter,
    resetPasswordRateLimiter,
    resendVerificationRateLimiter,
    requestVerificationRateLimiter,
    recoverEmailRateLimiter,
  );
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // In local API-only mode, the frontend runs in a separate Vite process and proxies /api.
  if (shouldUseInternalVite()) {
    await setupVite(app, server);
  } else if (ENV.isProduction) {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
