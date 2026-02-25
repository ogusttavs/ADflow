import { randomBytes } from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import { COOKIE_NAME, SESSION_DURATION_MS } from "@shared/const";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import {
  GOOGLE_CALENDAR_OAUTH_STATE_COOKIE,
  GOOGLE_LOGIN_OAUTH_STATE_COOKIE,
  buildGoogleLoginAuthUrl,
  exchangeGoogleCodeForUserProfile,
  exchangeGoogleCodeForTokens,
  upsertGoogleCalendarConnection,
} from "./googleCalendar";
import { sdk } from "./sdk";
import { ENV } from "./env";

function getRequestOrigin(req: Request) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = Array.isArray(forwardedProto)
    ? forwardedProto[0]?.split(",")[0]?.trim()
    : typeof forwardedProto === "string"
      ? forwardedProto.split(",")[0]?.trim()
      : req.protocol;
  const host = req.get("host");
  if (!host) return null;
  return `${protocol || req.protocol}://${host}`;
}

function redirectWithStatus(
  req: Request,
  res: Response,
  path: string,
  queryKey: string,
  status: string,
) {
  const origin = getRequestOrigin(req);
  if (!origin) {
    res.redirect(`${path}?${queryKey}=${encodeURIComponent(status)}`);
    return;
  }
  const url = new URL(path, origin);
  url.searchParams.set(queryKey, status);
  res.redirect(url.toString());
}

function redirectToAgenda(req: Request, res: Response, status: string) {
  redirectWithStatus(req, res, "/agenda", "google_calendar", status);
}

function redirectToLogin(req: Request, res: Response, status: string) {
  redirectWithStatus(req, res, "/login", "google_login", status);
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/google/login", (req, res) => {
    if (!ENV.googleClientId || !ENV.googleClientSecret) {
      redirectToLogin(req, res, "config_missing");
      return;
    }

    const state = randomBytes(24).toString("hex");
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(GOOGLE_LOGIN_OAUTH_STATE_COOKIE, state, {
      ...cookieOptions,
      maxAge: 10 * 60 * 1000,
    });

    const authUrl = buildGoogleLoginAuthUrl(req, state);
    res.redirect(authUrl);
  });

  app.get("/api/oauth/google/login/callback", async (req, res) => {
    const cookieOptions = getSessionCookieOptions(req);
    const code = typeof req.query.code === "string" ? req.query.code : null;
    const state = typeof req.query.state === "string" ? req.query.state : null;
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const savedState = cookies[GOOGLE_LOGIN_OAUTH_STATE_COOKIE];
    res.clearCookie(GOOGLE_LOGIN_OAUTH_STATE_COOKIE, cookieOptions);

    if (!code) {
      redirectToLogin(req, res, "missing_code");
      return;
    }
    if (!state || !savedState || state !== savedState) {
      redirectToLogin(req, res, "state_error");
      return;
    }

    try {
      const { profile } = await exchangeGoogleCodeForUserProfile(req, code);
      const googleOpenId = `google_${profile.sub}`;

      let user = await db.getUserByOpenId(googleOpenId);

      if (!user && profile.email) {
        const userByEmail = await db.getUserByEmail(profile.email);
        if (userByEmail) {
          const canLink = userByEmail.openId === googleOpenId || userByEmail.openId.startsWith("local_");
          if (!canLink) {
            redirectToLogin(req, res, "email_conflict");
            return;
          }

          const mergedLoginMethod = userByEmail.passwordHash ? "email_google" : "google";
          user = await db.updateUserById(userByEmail.id, {
            openId: googleOpenId,
            name: profile.name ?? userByEmail.name ?? null,
            email: profile.email ?? userByEmail.email ?? null,
            loginMethod: mergedLoginMethod,
            lastSignedIn: new Date(),
          }) ?? undefined;
        }
      }

      if (!user) {
        const userCount = await db.getUserCount();
        const isFirstUser = userCount === 0;
        await db.upsertUser({
          openId: googleOpenId,
          name: profile.name ?? profile.email ?? "Usuário Google",
          email: profile.email ?? null,
          loginMethod: "google",
          role: isFirstUser ? "admin" : "user",
          lastSignedIn: new Date(),
        });
        user = await db.getUserByOpenId(googleOpenId);
      } else {
        await db.upsertUser({
          openId: googleOpenId,
          name: profile.name ?? user.name ?? null,
          email: profile.email ?? user.email ?? null,
          loginMethod: user.passwordHash ? "email_google" : "google",
          role: user.role,
          lastSignedIn: new Date(),
        });
      }

      if (!user) {
        redirectToLogin(req, res, "user_error");
        return;
      }

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name ?? profile.name ?? "",
        expiresInMs: SESSION_DURATION_MS,
      });
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: SESSION_DURATION_MS,
      });

      redirectWithStatus(req, res, "/dashboard", "google_login", "success");
      return;
    } catch (error) {
      console.error("[OAuth] Google login callback failed:", error);
      redirectToLogin(req, res, "error");
      return;
    }
  });

  app.get("/api/oauth/google/callback", async (req, res) => {
    const cookieOptions = getSessionCookieOptions(req);

    const code = typeof req.query.code === "string" ? req.query.code : null;
    const state = typeof req.query.state === "string" ? req.query.state : null;
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const savedState = cookies[GOOGLE_CALENDAR_OAUTH_STATE_COOKIE];
    res.clearCookie(GOOGLE_CALENDAR_OAUTH_STATE_COOKIE, cookieOptions);

    if (!code) {
      redirectToAgenda(req, res, "missing_code");
      return;
    }
    if (!state || !savedState || state !== savedState) {
      redirectToAgenda(req, res, "state_error");
      return;
    }

    try {
      const user = await sdk.authenticateRequest(req);
      const tokenPayload = await exchangeGoogleCodeForTokens(req, code);
      await upsertGoogleCalendarConnection(user.id, tokenPayload);
      redirectToAgenda(req, res, "connected");
      return;
    } catch (error) {
      console.error("[OAuth] Google callback failed:", error);
      redirectToAgenda(req, res, "error");
      return;
    }
  });
}
