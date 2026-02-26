export const ENV = {
  appId: process.env.VITE_APP_ID ?? "orbita",
  appBaseUrl: process.env.APP_BASE_URL ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  credentialEncryptionKey: process.env.CREDENTIAL_ENCRYPTION_KEY ?? "",
  userPiiEncryptionKey:
    process.env.USER_PII_ENCRYPTION_KEY ??
    process.env.CREDENTIAL_ENCRYPTION_KEY ??
    "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  emailProvider: process.env.EMAIL_PROVIDER ?? "mock",
  emailFrom: process.env.EMAIL_FROM ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  asaasEnv: process.env.ASAAS_ENV ?? "sandbox",
  asaasApiBaseUrl: process.env.ASAAS_API_BASE_URL ?? "",
  asaasApiKey: process.env.ASAAS_API_KEY ?? "",
  asaasWebhookToken: process.env.ASAAS_WEBHOOK_TOKEN ?? "",
  // AI providers (configure at least one to enable AI features)
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  // Google OAuth / Calendar
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleOAuthRedirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI ?? "",
  googleLoginOAuthRedirectUri: process.env.GOOGLE_LOGIN_OAUTH_REDIRECT_URI ?? "",
  // Legacy Forge API (Manus) — kept for compatibility
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
