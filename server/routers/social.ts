import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { socialAccounts, scheduledPosts, clients, campaigns } from "../../drizzle/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const socialRouter = router({
  listAccounts: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [client] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(and(eq(clients.id, input.clientId), eq(clients.userId, ctx.user.id)))
        .limit(1);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado" });

      return db
        .select()
        .from(socialAccounts)
        .where(eq(socialAccounts.clientId, input.clientId))
        .orderBy(desc(socialAccounts.createdAt));
    }),

  connectAccount: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      platform: z.enum(["instagram", "facebook", "tiktok", "linkedin", "youtube"]),
      accountName: z.string(),
      accountId: z.string().optional(),
      accessToken: z.string().optional(),
      pageId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [client] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(and(eq(clients.id, input.clientId), eq(clients.userId, ctx.user.id)))
        .limit(1);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado" });

      const [result] = await db.insert(socialAccounts).values({
        ...input,
        isConnected: true,
        lastSyncAt: new Date(),
      });
      return { id: (result as any).insertId };
    }),

  disconnectAccount: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [account] = await db
        .select({ id: socialAccounts.id, clientId: socialAccounts.clientId })
        .from(socialAccounts)
        .where(eq(socialAccounts.id, input.id))
        .limit(1);
      if (!account) throw new TRPCError({ code: "NOT_FOUND" });

      const [client] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(and(eq(clients.id, account.clientId), eq(clients.userId, ctx.user.id)))
        .limit(1);
      if (!client) throw new TRPCError({ code: "NOT_FOUND" });

      await db
        .update(socialAccounts)
        .set({ isConnected: false, accessToken: null })
        .where(eq(socialAccounts.id, input.id));
      return { success: true };
    }),

  schedulePost: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      socialAccountId: z.number(),
      platform: z.string(),
      content: z.string(),
      mediaUrl: z.string().optional(),
      scheduledAt: z.string(),
      copyId: z.number().optional(),
      creativeId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [campaign] = await db
        .select({ id: campaigns.id, clientId: campaigns.clientId })
        .from(campaigns)
        .where(and(eq(campaigns.id, input.campaignId), eq(campaigns.userId, ctx.user.id)))
        .limit(1);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campanha não encontrada" });

      const [account] = await db
        .select({ id: socialAccounts.id })
        .from(socialAccounts)
        .where(and(eq(socialAccounts.id, input.socialAccountId), eq(socialAccounts.clientId, campaign.clientId)))
        .limit(1);
      if (!account) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Conta social não encontrada para o cliente da campanha",
        });
      }

      const [result] = await db.insert(scheduledPosts).values({
        ...input,
        scheduledAt: new Date(input.scheduledAt),
        status: "scheduled",
      });
      return { id: (result as any).insertId };
    }),

  listScheduledPosts: protectedProcedure
    .input(z.object({ campaignId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      if (input.campaignId) {
        const [campaign] = await db
          .select({ id: campaigns.id })
          .from(campaigns)
          .where(and(eq(campaigns.id, input.campaignId), eq(campaigns.userId, ctx.user.id)))
          .limit(1);
        if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campanha não encontrada" });

        return db
          .select()
          .from(scheduledPosts)
          .where(eq(scheduledPosts.campaignId, input.campaignId))
          .orderBy(desc(scheduledPosts.scheduledAt));
      }

      const userCampaigns = await db
        .select({ id: campaigns.id })
        .from(campaigns)
        .where(eq(campaigns.userId, ctx.user.id));
      const campaignIds = userCampaigns.map(c => c.id);
      if (campaignIds.length === 0) return [];

      return db
        .select()
        .from(scheduledPosts)
        .where(inArray(scheduledPosts.campaignId, campaignIds))
        .orderBy(desc(scheduledPosts.scheduledAt));
    }),

  cancelPost: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [post] = await db
        .select({ id: scheduledPosts.id, campaignId: scheduledPosts.campaignId })
        .from(scheduledPosts)
        .where(eq(scheduledPosts.id, input.id))
        .limit(1);
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });

      const [campaign] = await db
        .select({ id: campaigns.id })
        .from(campaigns)
        .where(and(eq(campaigns.id, post.campaignId), eq(campaigns.userId, ctx.user.id)))
        .limit(1);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });

      await db
        .update(scheduledPosts)
        .set({ status: "cancelled" })
        .where(eq(scheduledPosts.id, input.id));
      return { success: true };
    }),

  // Simulate publishing (real integration requires OAuth tokens from each platform)
  publishNow: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [post] = await db
        .select({ id: scheduledPosts.id, campaignId: scheduledPosts.campaignId })
        .from(scheduledPosts)
        .where(eq(scheduledPosts.id, input.postId))
        .limit(1);
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });

      const [campaign] = await db
        .select({ id: campaigns.id })
        .from(campaigns)
        .where(and(eq(campaigns.id, post.campaignId), eq(campaigns.userId, ctx.user.id)))
        .limit(1);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });

      // In production, this would call the respective platform API
      await db
        .update(scheduledPosts)
        .set({
          status: "published",
          publishedAt: new Date(),
          platformPostId: `sim_${Date.now()}`,
        })
        .where(eq(scheduledPosts.id, input.postId));
      return { success: true, message: "Post publicado com sucesso (simulação)" };
    }),
});
