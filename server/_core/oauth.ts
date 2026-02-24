// Auth routes were replaced by email/password login.
// Login and registration are handled via tRPC procedures:
//   auth.login   → POST /api/trpc/auth.login
//   auth.register → POST /api/trpc/auth.register
import type { Express } from "express";

export function registerOAuthRoutes(_app: Express) {
  // no-op: authentication is now handled by tRPC
}
