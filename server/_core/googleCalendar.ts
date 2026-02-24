import { eq } from "drizzle-orm";
import type { Request } from "express";
import { z } from "zod";
import { googleCalendarConnections, type GoogleCalendarConnection } from "../../drizzle/schema";
import { getDb } from "../db";
import { ENV } from "./env";

const GOOGLE_AUTH_BASE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";
const TOKEN_REFRESH_BUFFER_MS = 60_000;

export const GOOGLE_CALENDAR_OAUTH_STATE_COOKIE = "adflow_google_calendar_oauth_state";
export const GOOGLE_LOGIN_OAUTH_STATE_COOKIE = "adflow_google_login_oauth_state";
// Backward-compatible alias for old imports.
export const GOOGLE_OAUTH_STATE_COOKIE = GOOGLE_CALENDAR_OAUTH_STATE_COOKIE;

export const GOOGLE_CALENDAR_AUTH_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar",
];
export const GOOGLE_LOGIN_AUTH_SCOPES = [
  "openid",
  "email",
  "profile",
];

const googleTokenSchema = z.object({
  access_token: z.string(),
  expires_in: z.number().optional(),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
  token_type: z.string().optional(),
});

const googleUserInfoSchema = z.object({
  sub: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email().optional(),
});

export type GoogleTokenPayload = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string;
  tokenType?: string;
  email?: string;
};

export type GoogleUserProfile = {
  sub: string;
  name?: string;
  email?: string;
};

function requireGoogleOAuthConfig() {
  if (!ENV.googleClientId || !ENV.googleClientSecret) {
    throw new Error("Google OAuth não configurado. Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET.");
  }
}

function getRequestProtocol(req: Request) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (Array.isArray(forwardedProto) && forwardedProto[0]) {
    return forwardedProto[0].split(",")[0]!.trim();
  }
  if (typeof forwardedProto === "string" && forwardedProto) {
    return forwardedProto.split(",")[0]!.trim();
  }
  return req.protocol;
}

function getRequestOrigin(req: Request) {
  const host = req.get("host");
  if (!host) throw new Error("Não foi possível resolver host da requisição");
  return `${getRequestProtocol(req)}://${host}`;
}

function resolveRedirectUri(req: Request, path: string, override: string) {
  if (override) return override;
  return `${getRequestOrigin(req)}${path}`;
}

export function getGoogleCalendarRedirectUri(req: Request) {
  return resolveRedirectUri(req, "/api/oauth/google/callback", ENV.googleOAuthRedirectUri);
}

export function buildGoogleCalendarAuthUrl(req: Request, state: string) {
  return buildGoogleAuthUrl(req, {
    state,
    scopes: GOOGLE_CALENDAR_AUTH_SCOPES,
    redirectUri: getGoogleCalendarRedirectUri(req),
    prompt: "consent",
  });
}

export function getGoogleLoginRedirectUri(req: Request) {
  return resolveRedirectUri(req, "/api/oauth/google/login/callback", ENV.googleLoginOAuthRedirectUri);
}

export function buildGoogleLoginAuthUrl(req: Request, state: string) {
  return buildGoogleAuthUrl(req, {
    state,
    scopes: GOOGLE_LOGIN_AUTH_SCOPES,
    redirectUri: getGoogleLoginRedirectUri(req),
    prompt: "select_account",
  });
}

function buildGoogleAuthUrl(
  _req: Request,
  options: {
    state: string;
    scopes: string[];
    redirectUri: string;
    prompt?: string;
  },
) {
  requireGoogleOAuthConfig();
  const params = new URLSearchParams({
    client_id: ENV.googleClientId,
    redirect_uri: options.redirectUri,
    response_type: "code",
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: options.prompt ?? "consent",
    state: options.state,
    scope: options.scopes.join(" "),
  });
  return `${GOOGLE_AUTH_BASE_URL}?${params.toString()}`;
}

async function parseGoogleError(response: Response) {
  const text = await response.text();
  if (!text) return `HTTP ${response.status}`;
  return text.length > 600 ? `${text.slice(0, 600)}...` : text;
}

async function fetchGoogleToken(body: URLSearchParams) {
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!response.ok) {
    const details = await parseGoogleError(response);
    throw new Error(`Falha no token do Google: ${details}`);
  }
  const parsed = googleTokenSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("Resposta de token do Google inválida");
  }
  return parsed.data;
}

async function fetchGoogleUserEmail(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return undefined;
  const parsed = googleUserInfoSchema.safeParse(await response.json());
  if (!parsed.success) return undefined;
  return parsed.data.email;
}

export async function fetchGoogleUserProfile(accessToken: string): Promise<GoogleUserProfile | null> {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  const parsed = googleUserInfoSchema.safeParse(await response.json());
  if (!parsed.success || !parsed.data.sub) return null;
  return {
    sub: parsed.data.sub,
    name: parsed.data.name,
    email: parsed.data.email,
  };
}

export async function exchangeGoogleCodeForTokens(
  req: Request,
  code: string,
  redirectUri: string = getGoogleCalendarRedirectUri(req),
): Promise<GoogleTokenPayload> {
  requireGoogleOAuthConfig();
  const tokenData = await fetchGoogleToken(new URLSearchParams({
    code,
    client_id: ENV.googleClientId,
    client_secret: ENV.googleClientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  }));
  const email = await fetchGoogleUserEmail(tokenData.access_token);
  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
    scope: tokenData.scope,
    tokenType: tokenData.token_type,
    email,
  };
}

export async function exchangeGoogleCodeForUserProfile(
  req: Request,
  code: string,
  redirectUri: string = getGoogleLoginRedirectUri(req),
) {
  const tokenPayload = await exchangeGoogleCodeForTokens(req, code, redirectUri);
  const profile = await fetchGoogleUserProfile(tokenPayload.accessToken);
  if (!profile) {
    throw new Error("Não foi possível obter perfil do Google.");
  }
  return { tokenPayload, profile };
}

async function refreshGoogleAccessToken(refreshToken: string): Promise<GoogleTokenPayload> {
  requireGoogleOAuthConfig();
  const tokenData = await fetchGoogleToken(new URLSearchParams({
    refresh_token: refreshToken,
    client_id: ENV.googleClientId,
    client_secret: ENV.googleClientSecret,
    grant_type: "refresh_token",
  }));
  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
    scope: tokenData.scope,
    tokenType: tokenData.token_type,
  };
}

export async function getGoogleCalendarConnection(userId: number): Promise<GoogleCalendarConnection | null> {
  const db = await getDb();
  if (!db) return null;
  const [connection] = await db
    .select()
    .from(googleCalendarConnections)
    .where(eq(googleCalendarConnections.userId, userId))
    .limit(1);
  return connection ?? null;
}

export async function upsertGoogleCalendarConnection(userId: number, tokenPayload: GoogleTokenPayload) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  const existing = await getGoogleCalendarConnection(userId);
  const refreshToken = tokenPayload.refreshToken ?? existing?.refreshToken ?? null;
  const expiryDate = tokenPayload.expiresIn
    ? new Date(Date.now() + tokenPayload.expiresIn * 1000)
    : (existing?.expiryDate ?? null);
  const googleEmail = tokenPayload.email ?? existing?.googleEmail ?? null;
  const scope = tokenPayload.scope ?? existing?.scope ?? null;
  const tokenType = tokenPayload.tokenType ?? existing?.tokenType ?? null;
  const calendarId = existing?.calendarId ?? "primary";

  await db.insert(googleCalendarConnections).values({
    userId,
    googleEmail,
    accessToken: tokenPayload.accessToken,
    refreshToken,
    scope,
    tokenType,
    expiryDate,
    calendarId,
    connectedAt: existing?.connectedAt ?? new Date(),
    lastSyncAt: existing?.lastSyncAt ?? null,
  }).onDuplicateKeyUpdate({
    set: {
      googleEmail,
      accessToken: tokenPayload.accessToken,
      refreshToken,
      scope,
      tokenType,
      expiryDate,
      calendarId,
    },
  });

  const updated = await getGoogleCalendarConnection(userId);
  if (!updated) throw new Error("Não foi possível persistir conexão Google");
  return updated;
}

export async function removeGoogleCalendarConnection(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.delete(googleCalendarConnections).where(eq(googleCalendarConnections.userId, userId));
}

export async function ensureGoogleCalendarAccess(userId: number) {
  const connection = await getGoogleCalendarConnection(userId);
  if (!connection) {
    throw new Error("Google Agenda não conectado para este usuário.");
  }

  const expiresAt = connection.expiryDate?.getTime() ?? 0;
  const now = Date.now();
  const stillValid = connection.accessToken && (!expiresAt || expiresAt - now > TOKEN_REFRESH_BUFFER_MS);
  if (stillValid) {
    return { connection, accessToken: connection.accessToken };
  }

  if (!connection.refreshToken) {
    throw new Error("Conexão Google sem refresh token. Reconecte a conta.");
  }

  const refreshed = await refreshGoogleAccessToken(connection.refreshToken);
  const updated = await upsertGoogleCalendarConnection(userId, {
    ...refreshed,
    email: connection.googleEmail ?? undefined,
  });
  return { connection: updated, accessToken: updated.accessToken };
}

export async function googleCalendarApiRequest<T>(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const details = await parseGoogleError(response);
    throw new Error(`Google Calendar API falhou: ${details}`);
  }
  return await response.json() as T;
}
