import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { referrals, performanceMetrics, clients, campaigns } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

async function ensureClientOwnership(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  clientId: number,
  userId: number
) {
  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.userId, userId)))
    .limit(1);

  if (!client) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado" });
  }
}

export const referralsRouter = router({
  myReferrals: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return await db.select().from(referrals)
      .where(eq(referrals.referrerId, ctx.user.id))
      .orderBy(desc(referrals.createdAt));
  }),

  getMyCode: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { code: "" };
    const existing = await db.select().from(referrals)
      .where(eq(referrals.referrerId, ctx.user.id));
    if (existing.length > 0) return { code: existing[0].code };
    // Create a referral code for this user
    const code = `ABM-${nanoid(6).toUpperCase()}`;
    return { code };
  }),

  invite: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const code = `ABM-${nanoid(6).toUpperCase()}`;
      const result = await db.insert(referrals).values({
        referrerId: ctx.user.id,
        referredEmail: input.email,
        code,
        status: "pending",
        rewardType: "credit",
        rewardValue: 5000, // R$50 in cents
      });
      return { id: result[0].insertId, code };
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { total: 0, pending: 0, converted: 0, totalRewards: 0 };
    const all = await db.select().from(referrals)
      .where(eq(referrals.referrerId, ctx.user.id));
    return {
      total: all.length,
      pending: all.filter(r => r.status === "pending").length,
      converted: all.filter(r => r.status === "converted").length,
      totalRewards: all.filter(r => r.status === "converted").reduce((s, r) => s + (r.rewardValue || 0), 0),
    };
  }),
});

// ─── Performance Metrics Router ───────────────────────────────────────────────
export const performanceRouter = router({
  getByClient: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      await ensureClientOwnership(db, input.clientId, ctx.user.id);
      return await db.select().from(performanceMetrics)
        .where(eq(performanceMetrics.clientId, input.clientId))
        .orderBy(desc(performanceMetrics.date));
    }),

  getByPlatform: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return {};
      await ensureClientOwnership(db, input.clientId, ctx.user.id);
      const rows = await db.select().from(performanceMetrics)
        .where(eq(performanceMetrics.clientId, input.clientId));

      const byPlatform: Record<string, {
        impressions: number; clicks: number; conversions: number;
        spend: number; revenue: number; count: number;
      }> = {};

      for (const r of rows) {
        if (!byPlatform[r.platform]) {
          byPlatform[r.platform] = { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0, count: 0 };
        }
        byPlatform[r.platform].impressions += r.impressions || 0;
        byPlatform[r.platform].clicks += r.clicks || 0;
        byPlatform[r.platform].conversions += r.conversions || 0;
        byPlatform[r.platform].spend += r.spend || 0;
        byPlatform[r.platform].revenue += r.revenue || 0;
        byPlatform[r.platform].count++;
      }

      return byPlatform;
    }),

  addMetric: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      campaignId: z.number().optional(),
      platform: z.string(),
      date: z.string(),
      impressions: z.number().optional(),
      clicks: z.number().optional(),
      conversions: z.number().optional(),
      spend: z.number().optional(),
      revenue: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await ensureClientOwnership(db, input.clientId, ctx.user.id);

      if (input.campaignId) {
        const [campaign] = await db
          .select({ id: campaigns.id })
          .from(campaigns)
          .where(
            and(
              eq(campaigns.id, input.campaignId),
              eq(campaigns.userId, ctx.user.id),
              eq(campaigns.clientId, input.clientId)
            )
          )
          .limit(1);
        if (!campaign) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Campanha inválida para o cliente informado",
          });
        }
      }

      const spend = input.spend || 0;
      const clicks = input.clicks || 0;
      const conversions = input.conversions || 0;
      const impressions = input.impressions || 0;
      const revenue = input.revenue || 0;

      const ctr = impressions > 0 ? Math.round((clicks / impressions) * 10000) : 0;
      const cpc = clicks > 0 ? Math.round(spend / clicks) : 0;
      const cpa = conversions > 0 ? Math.round(spend / conversions) : 0;
      const roas = spend > 0 ? Math.round((revenue / spend) * 100) : 0;

      const result = await db.insert(performanceMetrics).values({
        clientId: input.clientId,
        campaignId: input.campaignId || null,
        platform: input.platform,
        date: new Date(input.date),
        impressions, clicks, conversions, spend, revenue,
        ctr, cpc, cpa, roas,
      });

      return { id: result[0].insertId };
    }),
});
