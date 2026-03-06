import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  COOKIE_NAME,
  SESSION_DURATION_MS,
  UNVERIFIED_ACCOUNT_MAX_AGE_MS,
} from "@shared/const";
import { getPasswordPolicyError } from "@shared/passwordPolicy";
import { normalizeTaxId } from "@shared/taxId";
import { createRawAuthToken, hashAuthToken } from "./_core/authToken";
import {
  createCheckoutCompletionToken,
  verifyCheckoutCompletionToken,
} from "./_core/checkoutCompletion";
import { getSessionCookieOptions } from "./_core/cookies";
import { sendTransactionalEmail } from "./_core/email";
import { ENV } from "./_core/env";
import {
  resolveKiwifyCheckoutUrl,
  type KiwifyCheckoutPrefill,
} from "./_core/kiwify";
import {
  decryptProfileSensitiveValue,
  encryptProfileSensitiveValue,
} from "./_core/profileCrypto";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import type { SessionUser } from "./_core/context";
import * as db from "./db";
import { clientsRouter } from "./routers/clients";
import { campaignsRouter } from "./routers/campaigns";
import { notificationsRouter } from "./routers/notifications";
import { whatsappRouter } from "./routers/whatsapp";
import { socialRouter } from "./routers/social";
import { aiRouter } from "./routers/ai";
import { crmRouter } from "./routers/crm";
import { abTestsRouter } from "./routers/abtests";
import { reportsRouter } from "./routers/reports";
import { utmRouter } from "./routers/utm";
import { budgetRouter } from "./routers/budget";
import { referralsRouter, performanceRouter } from "./routers/referrals";
import { productivityRouter } from "./routers/productivity";
import { voiceRouter } from "./routers/voice";
import { aiCommandRouter } from "./routers/aicommand";
import { financeiroRouter } from "./routers/financeiro";
import { billingRouter } from "./routers/billing";
import { filesRouter } from "./routers/files";
import { credentialsRouter } from "./routers/credentials";
import { intakeRouter } from "./routers/intake";
import { diaryRouter } from "./routers/diary";
import { dreamsRouter } from "./routers/dreams";
import { familyRouter } from "./routers/family";
import { googleCalendarRouter } from "./routers/googleCalendar";
import type { User } from "../drizzle/schema";

function resolveAppBaseUrl(req: {
  protocol?: string;
  get?: (name: string) => string | undefined;
}) {
  const configuredBaseUrl = ENV.appBaseUrl.trim().replace(/\/+$/, "");
  if (configuredBaseUrl) return configuredBaseUrl;

  const forwardedHost = req.get?.("x-forwarded-host");
  const host = forwardedHost || req.get?.("host") || "localhost:3000";
  const forwardedProto = req.get?.("x-forwarded-proto");
  const protocol = forwardedProto?.split(",")[0]?.trim() || req.protocol || "http";

  return `${protocol}://${host}`.replace(/\/+$/, "");
}

const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000;
const BILLING_GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000;
const ORBITA_PLANS = [
  "personal_standard",
  "personal_pro",
  "business_standard",
  "business_pro",
] as const;
const BILLING_TYPES = ["PIX", "BOLETO", "CREDIT_CARD"] as const;

const registerInputSchema = z.object({
  firstName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(120),
  lastName: z.string().min(2, "Sobrenome deve ter pelo menos 2 caracteres").max(120),
  email: z.string().email("Email inválido"),
  password: z.string().min(1).max(128),
  whatsapp: z.string().min(8, "WhatsApp inválido").max(32),
  taxId: z.string().min(11, "CPF/CNPJ inválido").max(18),
});

const registerForCheckoutInputSchema = registerInputSchema.extend({
  plan: z.enum(ORBITA_PLANS),
});

const checkoutProfileCompletionInputSchema = z.object({
  city: z.string().min(2, "Cidade inválida").max(120),
  address: z.string().min(5, "Endereço inválido").max(255),
  acquisitionSource: z.string().min(2, "Informe onde conheceu a Orbita").max(255),
  preferredLanguage: z.string().min(2, "Idioma inválido").max(80),
  marketingOptIn: z.boolean(),
});

const updateProfileInputSchema = z.object({
  firstName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(120),
  lastName: z.string().min(2, "Sobrenome deve ter pelo menos 2 caracteres").max(120),
  email: z.string().email("Email inválido"),
  whatsapp: z.string().min(8, "WhatsApp inválido").max(32),
  city: z.string().min(2, "Cidade inválida").max(120),
  address: z.string().min(5, "Endereço inválido").max(255),
  acquisitionSource: z.string().min(2, "Informe onde conheceu a Orbita").max(255),
  preferredLanguage: z.string().min(2, "Idioma inválido").max(80),
  marketingOptIn: z.boolean(),
  taxId: z.string().max(18).optional(),
});

function normalizeTaxIdOrThrow(rawTaxId: string): { digits: string; type: "cpf" | "cnpj" } {
  const normalized = normalizeTaxId(rawTaxId);
  if (normalized) return normalized;

  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "CPF/CNPJ inválido. Verifique os dígitos informados.",
  });
}

function ensureStrongPasswordOrThrow(password: string) {
  const policyError = getPasswordPolicyError(password);
  if (policyError) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: policyError,
    });
  }
}

function isUnverifiedAccountExpired(user: Pick<User, "emailVerified" | "createdAt">) {
  if (user.emailVerified) return false;
  const ageMs = Date.now() - user.createdAt.getTime();
  return ageMs >= UNVERIFIED_ACCOUNT_MAX_AGE_MS;
}

async function expireUnverifiedAccountIfNeeded(user: User): Promise<boolean> {
  if (!isUnverifiedAccountExpired(user)) return false;
  await db.deleteUserAndAuthTokensById(user.id);
  return true;
}

function maskTaxId(
  taxIdType: User["taxIdType"],
  taxIdLast4: User["taxIdLast4"],
): string | null {
  if (!taxIdLast4) return null;
  if (taxIdType === "cnpj") {
    return `**.***.***/****-${taxIdLast4}`;
  }
  return `***.***.***-${taxIdLast4}`;
}

function buildFullName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  fallbackName?: string | null,
) {
  const joinedName = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ").trim();
  if (joinedName) return joinedName;
  return String(fallbackName ?? "").trim();
}

function buildKiwifyCheckoutPrefill(input: {
  name?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  taxId?: string | null;
}): KiwifyCheckoutPrefill {
  return {
    name: input.name,
    email: input.email,
    phone: input.whatsapp,
    taxId: input.taxId,
    region: "br",
  };
}

function isCheckoutProfileComplete(
  user: Pick<
    User,
    "city" | "address" | "acquisitionSource" | "preferredLanguage"
  >,
) {
  return Boolean(
    user.city?.trim() &&
      user.address?.trim() &&
      user.acquisitionSource?.trim() &&
      user.preferredLanguage?.trim(),
  );
}

function canActivateCheckoutAccess(user: Pick<User, "planStatus">) {
  return user.planStatus === "active" || user.planStatus === "trial";
}

function toPublicUser(user: SessionUser) {
  return {
    id: user.id,
    openId: user.openId,
    role: user.role,
    loginMethod: user.loginMethod,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    whatsapp: user.whatsapp,
    city: user.city,
    address: user.address,
    acquisitionSource: user.acquisitionSource,
    preferredLanguage: user.preferredLanguage,
    marketingOptIn: user.marketingOptIn,
    emailVerified: user.emailVerified,
    emailVerifiedAt: user.emailVerifiedAt,
    plan: user.plan,
    planStatus: user.planStatus,
    planExpiry: user.planExpiry,
    taxIdMasked: maskTaxId(user.taxIdType, user.taxIdLast4),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastSignedIn: user.lastSignedIn,
  };
}

async function createAndSendEmailVerification(params: {
  userId: number;
  email: string;
  name: string | null;
  req: { protocol?: string; get?: (name: string) => string | undefined };
}) {
  const rawToken = createRawAuthToken();
  const tokenHash = hashAuthToken(rawToken);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MS);

  await db.createAuthToken({
    userId: params.userId,
    type: "email_verification",
    tokenHash,
    expiresAt,
  });

  const baseUrl = resolveAppBaseUrl(params.req);
  const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;

  await sendTransactionalEmail({
    to: params.email,
    subject: "Orbita - confirme seu email",
    html: [
      `<p>Olá, ${params.name || "usuário"}.</p>`,
      "<p>Para proteger sua conta, confirme seu email clicando no link abaixo:</p>",
      `<p><a href="${verifyUrl}">Confirmar email</a></p>`,
      "<p>Este link expira em 24 horas.</p>",
    ].join(""),
    text: `Confirme seu email em: ${verifyUrl}`,
  });
}

async function createEmailPasswordUser(params: {
  input: z.infer<typeof registerInputSchema>;
  initialPlan?: (typeof ORBITA_PLANS)[number];
}) {
  const normalizedEmail = params.input.email.trim().toLowerCase();
  const firstName = params.input.firstName.trim();
  const lastName = params.input.lastName.trim();
  const fullName = `${firstName} ${lastName}`.trim();
  const normalizedTaxId = normalizeTaxIdOrThrow(params.input.taxId.trim());
  ensureStrongPasswordOrThrow(params.input.password);

  let encryptedTaxId: string;
  try {
    encryptedTaxId = encryptProfileSensitiveValue(normalizedTaxId.digits);
  } catch (error) {
    console.error("[Auth] Failed to encrypt taxId during register", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Não foi possível proteger seus dados agora. Tente novamente em instantes.",
    });
  }

  const existing = await db.getUserByEmail(normalizedEmail);
  if (existing) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Este email já está cadastrado",
    });
  }

  const userCount = await db.getUserCount();
  const isFirstUser = userCount === 0;
  const passwordHash = await bcrypt.hash(params.input.password, 10);
  const openId = `local_${nanoid()}`;

  await db.upsertUser({
    openId,
    name: fullName,
    firstName,
    lastName,
    email: normalizedEmail,
    whatsapp: params.input.whatsapp.trim(),
    taxIdType: normalizedTaxId.type,
    taxIdEncrypted: encryptedTaxId,
    taxIdLast4: normalizedTaxId.digits.slice(-4),
    passwordHash,
    emailVerified: false,
    emailVerifiedAt: null,
    loginMethod: "email",
    role: isFirstUser ? "admin" : "user",
    lastSignedIn: new Date(),
    plan: params.initialPlan,
    planStatus: params.initialPlan ? "past_due" : undefined,
    planExpiry: params.initialPlan ? null : undefined,
  });

  const createdUser = await db.getUserByOpenId(openId);
  if (!createdUser) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Não foi possível concluir o cadastro agora. Tente novamente.",
    });
  }

  return {
    createdUser,
    fullName,
    openId,
    normalizedEmail,
    normalizedTaxIdDigits: normalizedTaxId.digits,
    normalizedWhatsapp: params.input.whatsapp.trim(),
  };
}

async function getCheckoutUserOrThrow(token: string) {
  const payload = await verifyCheckoutCompletionToken(token);
  if (!payload) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Sessão de checkout inválida ou expirada. Faça login para continuar.",
    });
  }

  const user = await db.getUserByOpenId(payload.openId);
  if (!user) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Não foi possível localizar a conta deste checkout.",
    });
  }

  if (await expireUnverifiedAccountIfNeeded(user)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Sua conta expirou por falta de verificação de email. Faça um novo cadastro.",
    });
  }

  return { payload, user };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => (ctx.user ? toPublicUser(ctx.user) : null)),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, cookieOptions);
      return { success: true } as const;
    }),

    login: publicProcedure
      .input(z.object({
        email: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message: "Banco de dados indisponível",
          });
        }

        const normalizedEmail = input.email.trim().toLowerCase();
        const user = await db.getUserByEmail(normalizedEmail);

        if (!user || !user.passwordHash) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email ou senha incorretos",
          });
        }

        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email ou senha incorretos",
          });
        }

        if (!user.emailVerified) {
          const accountExpired = await expireUnverifiedAccountIfNeeded(user);
          if (accountExpired) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message:
                "Sua conta expirou por falta de verificação de email. Faça um novo cadastro.",
            });
          }

          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Confirme seu email para entrar. Reenvie o link de verificação.",
          });
        }

        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name ?? "",
          expiresInMs: SESSION_DURATION_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: SESSION_DURATION_MS,
        });

        return { success: true } as const;
      }),

    register: publicProcedure
      .input(registerInputSchema)
      .mutation(async ({ input, ctx }) => {
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message: "Banco de dados indisponível",
          });
        }

        const { createdUser, fullName, openId } = await createEmailPasswordUser({
          input,
        });
        if (createdUser?.email) {
          // Do not block register response waiting for external email provider latency.
          void createAndSendEmailVerification({
            userId: createdUser.id,
            email: createdUser.email,
            name: createdUser.name,
            req: ctx.req,
          }).catch((error) => {
            // Soft lock flow: account can continue and user can re-request verification in-app.
            console.error("[Auth] Failed to send email verification during register", error);
          });
        }

        const sessionToken = await sdk.createSessionToken(openId, {
          name: fullName,
          expiresInMs: SESSION_DURATION_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: SESSION_DURATION_MS,
        });

        return { success: true } as const;
      }),

    registerForCheckout: publicProcedure
      .input(registerForCheckoutInputSchema)
      .mutation(async ({ input, ctx }) => {
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message: "Banco de dados indisponível",
          });
        }

        if (ENV.paymentProvider !== "kiwify") {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "PAYMENT_PROVIDER inválido para este fluxo. Configure PAYMENT_PROVIDER=kiwify.",
          });
        }

        const { createdUser, fullName, normalizedEmail, normalizedTaxIdDigits, normalizedWhatsapp } =
          await createEmailPasswordUser({
          input,
          initialPlan: input.plan,
        });

        const checkoutCompletionToken = await createCheckoutCompletionToken({
          openId: createdUser.openId,
          email: normalizedEmail,
          plan: input.plan,
        });

        const checkoutUrl = resolveKiwifyCheckoutUrl(
          input.plan,
          buildKiwifyCheckoutPrefill({
            name: fullName,
            email: normalizedEmail,
            whatsapp: normalizedWhatsapp,
            taxId: normalizedTaxIdDigits,
          }),
        );
        if (!checkoutUrl) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "Checkout deste plano não configurado na Kiwify. Defina as URLs de checkout no .env.",
          });
        }

        if (createdUser?.email) {
          void createAndSendEmailVerification({
            userId: createdUser.id,
            email: createdUser.email,
            name: createdUser.name,
            req: ctx.req,
          }).catch((error) => {
            console.error("[Auth] Failed to send email verification during checkout register", error);
          });
        }

        return {
          success: true,
          plan: input.plan,
          planStatus: "past_due" as const,
          checkoutUrl,
          checkoutCompletionToken,
          emailVerificationRequired: true,
        };
      }),

    getCheckoutCompletionContext: publicProcedure
      .input(z.object({
        token: z.string().min(20),
      }))
      .query(async ({ input }) => {
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message: "Banco de dados indisponível",
          });
        }

        const { user, payload } = await getCheckoutUserOrThrow(input.token);

        return {
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          name: buildFullName(user.firstName, user.lastName, user.name),
          email: user.email ?? payload.email,
          whatsapp: user.whatsapp ?? "",
          city: user.city ?? "",
          address: user.address ?? "",
          acquisitionSource: user.acquisitionSource ?? "",
          preferredLanguage: user.preferredLanguage ?? "Português (Brasil)",
          marketingOptIn: Boolean(user.marketingOptIn),
          plan: user.plan ?? payload.plan,
          planStatus: user.planStatus ?? "past_due",
          profileCompleted: isCheckoutProfileComplete(user),
          canAccessPlatform: canActivateCheckoutAccess(user),
          emailVerified: Boolean(user.emailVerified),
        } as const;
      }),

    completeCheckoutProfile: publicProcedure
      .input(
        z.object({
          token: z.string().min(20),
          profile: checkoutProfileCompletionInputSchema,
        }),
      )
      .mutation(async ({ input }) => {
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message: "Banco de dados indisponível",
          });
        }

        const { user } = await getCheckoutUserOrThrow(input.token);
        const profile = input.profile;

        const updatedUser = await db.updateUserById(user.id, {
          city: profile.city.trim(),
          address: profile.address.trim(),
          acquisitionSource: profile.acquisitionSource.trim(),
          preferredLanguage: profile.preferredLanguage.trim(),
          marketingOptIn: profile.marketingOptIn,
        });

        return {
          success: true,
          profileCompleted: isCheckoutProfileComplete(
            updatedUser ?? {
              ...user,
              city: profile.city.trim(),
              address: profile.address.trim(),
              acquisitionSource: profile.acquisitionSource.trim(),
              preferredLanguage: profile.preferredLanguage.trim(),
            },
          ),
          canAccessPlatform: canActivateCheckoutAccess(updatedUser ?? user),
        } as const;
      }),

    activateCheckoutAccess: publicProcedure
      .input(z.object({
        token: z.string().min(20),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message: "Banco de dados indisponível",
          });
        }

        const { user } = await getCheckoutUserOrThrow(input.token);
        if (!isCheckoutProfileComplete(user)) {
          return {
            success: false,
            canAccessPlatform: false,
            planStatus: user.planStatus ?? "past_due",
            profileCompleted: false,
          } as const;
        }
        if (!canActivateCheckoutAccess(user)) {
          return {
            success: false,
            canAccessPlatform: false,
            planStatus: user.planStatus ?? "past_due",
            profileCompleted: true,
          } as const;
        }

        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: buildFullName(user.firstName, user.lastName, user.name),
          expiresInMs: SESSION_DURATION_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: SESSION_DURATION_MS,
        });

        return {
          success: true,
          canAccessPlatform: true,
          planStatus: user.planStatus,
          profileCompleted: true,
        } as const;
      }),

    verifyEmail: publicProcedure
      .input(z.object({
        token: z.string().min(20),
      }))
      .mutation(async ({ input }) => {
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message: "Banco de dados indisponível",
          });
        }

        const tokenHash = hashAuthToken(input.token);
        const tokenRecord = await db.getActiveAuthTokenByHash({
          tokenHash,
          type: "email_verification",
        });

        if (!tokenRecord) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Link de verificação inválido ou expirado.",
          });
        }

        const user = await db.getUserById(tokenRecord.userId);
        if (!user) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Link de verificação inválido ou expirado.",
          });
        }

        await db.updateUserById(user.id, {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        });
        await db.markAuthTokenUsed(tokenRecord.id);

        return { success: true } as const;
      }),

    requestEmailVerification: publicProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message: "Banco de dados indisponível",
          });
        }

        const normalizedEmail = input.email.trim().toLowerCase();
        const user = await db.getUserByEmail(normalizedEmail);
        const genericResponse = { success: true } as const;

        if (!user || !user.email) {
          return genericResponse;
        }

        const accountExpired = await expireUnverifiedAccountIfNeeded(user);
        if (accountExpired || user.emailVerified) {
          return genericResponse;
        }

        try {
          await createAndSendEmailVerification({
            userId: user.id,
            email: user.email,
            name: user.name,
            req: ctx.req,
          });
        } catch (error) {
          console.error("[Auth] Failed to request email verification", error);
        }

        return genericResponse;
      }),

    recoverEmailByTaxId: publicProcedure
      .input(z.object({
        taxId: z.string().min(11).max(18),
      }))
      .mutation(async ({ input }) => {
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message: "Banco de dados indisponível",
          });
        }

        const normalizedTaxId = normalizeTaxIdOrThrow(input.taxId.trim());
        const candidates = await db.getUsersByTaxIdTail({
          taxIdType: normalizedTaxId.type,
          taxIdLast4: normalizedTaxId.digits.slice(-4),
        });

        for (const candidate of candidates) {
          if (!candidate.taxIdEncrypted || !candidate.email) continue;

          const accountExpired = await expireUnverifiedAccountIfNeeded(candidate);
          if (accountExpired) continue;

          try {
            const decryptedTaxId = decryptProfileSensitiveValue(candidate.taxIdEncrypted);
            if (decryptedTaxId === normalizedTaxId.digits) {
              return {
                success: true,
                email: candidate.email,
              } as const;
            }
          } catch (error) {
            // Ignore records with invalid/legacy encrypted value.
          }
        }

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não foi possível localizar uma conta com os dados informados.",
        });
      }),

    resendVerification: protectedProcedure
      .mutation(async ({ ctx }) => {
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message: "Banco de dados indisponível",
          });
        }

        const currentUser = await db.getUserByOpenId(ctx.user.openId);
        if (!currentUser || !currentUser.email) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Sua conta não possui email para verificação.",
          });
        }

        if (await expireUnverifiedAccountIfNeeded(currentUser)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Sua conta expirou por falta de verificação de email. Faça um novo cadastro.",
          });
        }

        if (currentUser.emailVerified) {
          return { success: true, alreadyVerified: true } as const;
        }

        try {
          await createAndSendEmailVerification({
            userId: currentUser.id,
            email: currentUser.email,
            name: currentUser.name,
            req: ctx.req,
          });
        } catch (error) {
          console.error("[Auth] Failed to resend email verification", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Não foi possível reenviar o email agora. Tente novamente.",
          });
        }

        return { success: true, alreadyVerified: false } as const;
      }),

    updateProfile: protectedProcedure
      .input(updateProfileInputSchema)
      .mutation(async ({ input, ctx }) => {
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message: "Banco de dados indisponível",
          });
        }

        const currentUser = await db.getUserByOpenId(ctx.user.openId);
        if (!currentUser) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Usuário não autenticado",
          });
        }

        const normalizedEmail = input.email.trim().toLowerCase();
        const firstName = input.firstName.trim();
        const lastName = input.lastName.trim();
        const fullName = `${firstName} ${lastName}`.trim();
        const emailChanged =
          normalizedEmail !== (currentUser.email ?? "").trim().toLowerCase();

        if (emailChanged) {
          const existingByEmail = await db.getUserByEmail(normalizedEmail);
          if (existingByEmail && existingByEmail.id !== currentUser.id) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Este email já está em uso por outra conta.",
            });
          }
        }

        const updates: Parameters<typeof db.updateUserById>[1] = {
          name: fullName,
          firstName,
          lastName,
          email: normalizedEmail,
          whatsapp: input.whatsapp.trim(),
          city: input.city.trim(),
          address: input.address.trim(),
          acquisitionSource: input.acquisitionSource.trim(),
          preferredLanguage: input.preferredLanguage.trim(),
          marketingOptIn: input.marketingOptIn,
        };

        if (emailChanged) {
          updates.emailVerified = false;
          updates.emailVerifiedAt = null;
        }

        const taxIdRaw = input.taxId?.trim() ?? "";
        if (taxIdRaw) {
          const normalizedTaxId = normalizeTaxIdOrThrow(taxIdRaw);
          try {
            updates.taxIdType = normalizedTaxId.type;
            updates.taxIdEncrypted = encryptProfileSensitiveValue(normalizedTaxId.digits);
            updates.taxIdLast4 = normalizedTaxId.digits.slice(-4);
          } catch (error) {
            console.error("[Auth] Failed to encrypt taxId during profile update", error);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Não foi possível proteger seus dados agora. Tente novamente em instantes.",
            });
          }
        }

        await db.updateUserById(currentUser.id, updates);

        if (emailChanged && normalizedEmail) {
          try {
            await createAndSendEmailVerification({
              userId: currentUser.id,
              email: normalizedEmail,
              name: fullName,
              req: ctx.req,
            });
          } catch (error) {
            console.error("[Auth] Failed to send email verification after profile update", error);
          }
        }

        return {
          success: true,
          emailVerificationRequired: emailChanged,
        } as const;
      }),

    requestPasswordReset: publicProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message: "Banco de dados indisponível",
          });
        }

        const normalizedEmail = input.email.trim().toLowerCase();
        const user = await db.getUserByEmail(normalizedEmail);

        // Generic response to prevent account enumeration.
        const genericResponse = { success: true } as const;

        if (!user || !user.email || !user.passwordHash) {
          return genericResponse;
        }

        if (await expireUnverifiedAccountIfNeeded(user)) {
          return genericResponse;
        }

        const rawToken = createRawAuthToken();
        const tokenHash = hashAuthToken(rawToken);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await db.createAuthToken({
          userId: user.id,
          type: "password_reset",
          tokenHash,
          expiresAt,
        });

        const baseUrl = resolveAppBaseUrl(ctx.req);
        const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

        try {
          await sendTransactionalEmail({
            to: user.email,
            subject: "Orbita - redefinição de senha",
            html: [
              `<p>Olá, ${user.name || "usuário"}.</p>`,
              `<p>Recebemos uma solicitação para redefinir sua senha.</p>`,
              `<p><a href="${resetUrl}">Clique aqui para criar uma nova senha</a>.</p>`,
              "<p>Este link expira em 1 hora. Se você não solicitou, pode ignorar este email.</p>",
            ].join(""),
            text: `Redefina sua senha em: ${resetUrl}`,
          });
        } catch (error) {
          console.error("[Auth] Failed to send password reset email", error);
        }

        return genericResponse;
      }),

    resetPassword: publicProcedure
      .input(z.object({
        token: z.string().min(20),
        newPassword: z.string().min(1).max(128),
      }))
      .mutation(async ({ input }) => {
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message: "Banco de dados indisponível",
          });
        }

        ensureStrongPasswordOrThrow(input.newPassword);

        const tokenHash = hashAuthToken(input.token);
        const tokenRecord = await db.getActiveAuthTokenByHash({
          tokenHash,
          type: "password_reset",
        });

        if (!tokenRecord) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Link de recuperação inválido ou expirado.",
          });
        }

        const user = await db.getUserById(tokenRecord.userId);
        if (!user) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Link de recuperação inválido ou expirado.",
          });
        }

        if (user.passwordHash) {
          const isSameAsCurrent = await bcrypt.compare(input.newPassword, user.passwordHash);
          if (isSameAsCurrent) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "A nova senha deve ser diferente da senha atual.",
            });
          }
        }

        const passwordHash = await bcrypt.hash(input.newPassword, 10);
        await db.updateUserById(user.id, {
          passwordHash,
          loginMethod:
            user.loginMethod === "google" ? "email_google" : user.loginMethod,
        });

        await db.markAuthTokenUsed(tokenRecord.id);

        return { success: true } as const;
      }),

    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(1).max(128),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message: "Banco de dados indisponível",
          });
        }

        ensureStrongPasswordOrThrow(input.newPassword);

        const currentUser = await db.getUserByOpenId(ctx.user.openId);
        if (!currentUser || !currentUser.passwordHash) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Sua conta não usa senha local para login.",
          });
        }
        if (await expireUnverifiedAccountIfNeeded(currentUser)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Sua conta expirou por falta de verificação de email. Faça um novo cadastro.",
          });
        }
        if (!currentUser.emailVerified) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Confirme seu email antes de alterar a senha.",
          });
        }

        const validCurrentPassword = await bcrypt.compare(
          input.currentPassword,
          currentUser.passwordHash
        );

        if (!validCurrentPassword) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Senha atual incorreta",
          });
        }

        if (input.currentPassword === input.newPassword) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A nova senha deve ser diferente da senha atual.",
          });
        }

        const newPasswordHash = await bcrypt.hash(input.newPassword, 10);
        await db.updateUserById(currentUser.id, {
          passwordHash: newPasswordHash,
        });

        return { success: true } as const;
      }),

    createSubscription: protectedProcedure
      .input(
        z.object({
          plan: z.enum(ORBITA_PLANS),
          billingType: z.enum(BILLING_TYPES).default("PIX"),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message: "Banco de dados indisponível",
          });
        }

        const currentUser = await db.getUserByOpenId(ctx.user.openId);
        if (!currentUser) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Usuário não autenticado.",
          });
        }
        if (await expireUnverifiedAccountIfNeeded(currentUser)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Sua conta expirou por falta de verificação de email. Faça um novo cadastro.",
          });
        }
        if (!currentUser.emailVerified) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Confirme seu email antes de ativar um plano.",
          });
        }
        if (!currentUser.email) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Seu usuário precisa ter email para contratar um plano.",
          });
        }
        if (ENV.paymentProvider !== "kiwify") {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "PAYMENT_PROVIDER inválido para este fluxo. Configure PAYMENT_PROVIDER=kiwify.",
          });
        }

        const fullName = buildFullName(
          currentUser.firstName,
          currentUser.lastName,
          currentUser.name,
        );
        let taxIdDigits: string | null = null;
        if (currentUser.taxIdEncrypted) {
          try {
            taxIdDigits = decryptProfileSensitiveValue(currentUser.taxIdEncrypted);
          } catch {
            console.warn("[Billing] Failed to decrypt taxId for Kiwify prefill");
          }
        }

        const checkoutUrl = resolveKiwifyCheckoutUrl(
          input.plan,
          buildKiwifyCheckoutPrefill({
            name: fullName,
            email: currentUser.email,
            whatsapp: currentUser.whatsapp,
            taxId: taxIdDigits,
          }),
        );
        if (!checkoutUrl) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "Checkout deste plano não configurado na Kiwify. Defina as URLs de checkout no .env.",
          });
        }

        const shouldPersistPendingSelection =
          currentUser.planStatus !== "active" && currentUser.planStatus !== "trial";
        if (shouldPersistPendingSelection) {
          await db.updateUserById(currentUser.id, {
            plan: input.plan,
            planStatus: "past_due",
            planExpiry: null,
          });
        }

        return {
          success: true,
          plan: input.plan,
          planStatus: shouldPersistPendingSelection ? "past_due" : currentUser.planStatus ?? null,
          asaasCustomerId: currentUser.asaasCustomerId ?? null,
          asaasSubscriptionId: currentUser.asaasSubscriptionId ?? null,
          checkoutUrl,
        } as const;
      }),

    getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) {
        throw new TRPCError({
          code: "SERVICE_UNAVAILABLE",
          message: "Banco de dados indisponível",
        });
      }

      const currentUser = await db.getUserByOpenId(ctx.user.openId);
      if (!currentUser) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado.",
        });
      }

      const now = Date.now();
      const expiryTime = currentUser.planExpiry?.getTime() ?? null;
      const isGracePeriod =
        currentUser.planStatus === "past_due" &&
        expiryTime !== null &&
        now - expiryTime <= BILLING_GRACE_PERIOD_MS;

      const canUsePaidFeatures =
        currentUser.planStatus === "active" ||
        currentUser.planStatus === "trial" ||
        isGracePeriod;

      return {
        plan: currentUser.plan,
        planStatus: currentUser.planStatus,
        planExpiry: currentUser.planExpiry,
        asaasCustomerId: currentUser.asaasCustomerId,
        asaasSubscriptionId: currentUser.asaasSubscriptionId,
        isGracePeriod,
        canUsePaidFeatures,
      } as const;
    }),
  }),
  clients: clientsRouter,
  campaigns: campaignsRouter,
  notifications: notificationsRouter,
  whatsapp: whatsappRouter,
  social: socialRouter,
  ai: aiRouter,
  crm: crmRouter,
  abTests: abTestsRouter,
  reports: reportsRouter,
  utm: utmRouter,
  budget: budgetRouter,
  referrals: referralsRouter,
  performance: performanceRouter,
  productivity: productivityRouter,
  voice: voiceRouter,
  aiCommand: aiCommandRouter,
  financeiro: financeiroRouter,
  billing: billingRouter,
  files: filesRouter,
  credentials: credentialsRouter,
  intake: intakeRouter,
  diary: diaryRouter,
  dreams: dreamsRouter,
  family: familyRouter,
  googleCalendar: googleCalendarRouter,
});

export type AppRouter = typeof appRouter;
