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

async function startServer() {
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
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
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

startServer().catch(console.error);
