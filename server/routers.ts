import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
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

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

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

        const user = await db.getUserByEmail(input.email);

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

        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name ?? "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        return { success: true } as const;
      }),

    register: publicProcedure
      .input(z.object({
        name: z.string(),
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

        const existing = await db.getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Este email já está cadastrado",
          });
        }

        const userCount = await db.getUserCount();
        const isFirstUser = userCount === 0;

        const passwordHash = await bcrypt.hash(input.password, 10);
        const openId = `local_${nanoid()}`;

        await db.upsertUser({
          openId,
          name: input.name,
          email: input.email,
          passwordHash,
          loginMethod: "email",
          role: isFirstUser ? "admin" : "user",
          lastSignedIn: new Date(),
        });

        const sessionToken = await sdk.createSessionToken(openId, {
          name: input.name,
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        return { success: true } as const;
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
