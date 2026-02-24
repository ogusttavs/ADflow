import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { clients, clientConfigs, campaigns } from "../../drizzle/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const clientSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().optional(),
  logoUrl: z.string().optional(),
  status: z.enum(["active", "inactive", "pending"]).default("active"),
});

const configSchema = z.object({
  toneOfVoice: z.enum(["professional", "casual", "humorous", "inspirational", "educational", "urgent"]).optional(),
  brandPersonality: z.string().optional(),
  targetAudience: z.string().optional(),
  ageRange: z.string().optional(),
  gender: z.enum(["all", "male", "female", "other"]).optional(),
  location: z.string().optional(),
  interests: z.string().optional(),
  productsServices: z.string().optional(),
  mainValueProposition: z.string().optional(),
  competitors: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  fontPreference: z.string().optional(),
  visualStyle: z.enum(["minimalist", "bold", "elegant", "playful", "corporate", "creative"]).optional(),
  activeChannels: z.array(z.string()).optional(),
  additionalContext: z.string().optional(),
});

export const clientsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const rows = await db
      .select()
      .from(clients)
      .where(eq(clients.userId, ctx.user.id))
      .orderBy(desc(clients.createdAt));
    return rows;
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, input.id), eq(clients.userId, ctx.user.id)))
      .limit(1);
    if (!client) throw new TRPCError({ code: "NOT_FOUND" });
    const [config] = await db
      .select()
      .from(clientConfigs)
      .where(eq(clientConfigs.clientId, input.id))
      .limit(1);
    const [campaignCount] = await db
      .select({ count: count() })
      .from(campaigns)
      .where(eq(campaigns.clientId, input.id));
    return { ...client, config: config ?? null, campaignCount: campaignCount?.count ?? 0 };
  }),

  create: protectedProcedure.input(clientSchema).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [result] = await db.insert(clients).values({ ...input, userId: ctx.user.id });
    return { id: (result as any).insertId };
  }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: clientSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(clients)
        .set(input.data)
        .where(and(eq(clients.id, input.id), eq(clients.userId, ctx.user.id)));
      return { success: true };
    }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db
      .delete(clients)
      .where(and(eq(clients.id, input.id), eq(clients.userId, ctx.user.id)));
    return { success: true };
  }),

  saveConfig: protectedProcedure
    .input(z.object({ clientId: z.number(), config: configSchema }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Verify ownership
      const [client] = await db
        .select()
        .from(clients)
        .where(and(eq(clients.id, input.clientId), eq(clients.userId, ctx.user.id)))
        .limit(1);
      if (!client) throw new TRPCError({ code: "NOT_FOUND" });

      const existing = await db
        .select()
        .from(clientConfigs)
        .where(eq(clientConfigs.clientId, input.clientId))
        .limit(1);

      const configData = {
        ...input.config,
        activeChannels: input.config.activeChannels ?? null,
      };

      if (existing.length > 0) {
        await db
          .update(clientConfigs)
          .set(configData)
          .where(eq(clientConfigs.clientId, input.clientId));
      } else {
        await db.insert(clientConfigs).values({ clientId: input.clientId, ...configData });
      }
      return { success: true };
    }),

  getConfig: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [client] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(and(eq(clients.id, input.clientId), eq(clients.userId, ctx.user.id)))
        .limit(1);
      if (!client) throw new TRPCError({ code: "NOT_FOUND" });

      const [config] = await db
        .select()
        .from(clientConfigs)
        .where(eq(clientConfigs.clientId, input.clientId))
        .limit(1);
      return config ?? null;
    }),
});
