import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { utmLinks } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

export const utmRouter = router({
  list: protectedProcedure
    .input(z.object({ campaignId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(utmLinks.userId, ctx.user.id)];
      if (input?.campaignId) conditions.push(eq(utmLinks.campaignId, input.campaignId));
      return await db.select().from(utmLinks).where(and(...conditions)).orderBy(desc(utmLinks.createdAt));
    }),

  create: protectedProcedure
    .input(z.object({
      campaignId: z.number().optional(),
      baseUrl: z.string().url(),
      utmSource: z.string(),
      utmMedium: z.string(),
      utmCampaign: z.string(),
      utmTerm: z.string().optional(),
      utmContent: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const params = new URLSearchParams();
      params.set("utm_source", input.utmSource);
      params.set("utm_medium", input.utmMedium);
      params.set("utm_campaign", input.utmCampaign);
      if (input.utmTerm) params.set("utm_term", input.utmTerm);
      if (input.utmContent) params.set("utm_content", input.utmContent);

      const separator = input.baseUrl.includes("?") ? "&" : "?";
      const fullUrl = `${input.baseUrl}${separator}${params.toString()}`;
      const shortCode = nanoid(8);

      const result = await db.insert(utmLinks).values({
        ...input,
        campaignId: input.campaignId || null,
        userId: ctx.user.id,
        fullUrl,
        shortCode,
      });

      return { id: result[0].insertId, fullUrl, shortCode };
    }),

  generateForCampaign: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      baseUrl: z.string().url(),
      campaignName: z.string(),
      channels: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const channelMap: Record<string, { source: string; medium: string }> = {
        instagram_feed: { source: "instagram", medium: "social" },
        instagram_stories: { source: "instagram", medium: "stories" },
        instagram_reels: { source: "instagram", medium: "reels" },
        facebook_feed: { source: "facebook", medium: "social" },
        facebook_stories: { source: "facebook", medium: "stories" },
        tiktok: { source: "tiktok", medium: "social" },
        linkedin: { source: "linkedin", medium: "social" },
        whatsapp: { source: "whatsapp", medium: "messaging" },
        email: { source: "email", medium: "email" },
      };

      const created: { channel: string; fullUrl: string }[] = [];
      const slug = input.campaignName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      for (const channel of input.channels) {
        const mapping = channelMap[channel] || { source: channel, medium: "other" };
        const params = new URLSearchParams();
        params.set("utm_source", mapping.source);
        params.set("utm_medium", mapping.medium);
        params.set("utm_campaign", slug);
        params.set("utm_content", channel);

        const separator = input.baseUrl.includes("?") ? "&" : "?";
        const fullUrl = `${input.baseUrl}${separator}${params.toString()}`;

        await db.insert(utmLinks).values({
          campaignId: input.campaignId,
          userId: ctx.user.id,
          baseUrl: input.baseUrl,
          utmSource: mapping.source,
          utmMedium: mapping.medium,
          utmCampaign: slug,
          utmContent: channel,
          fullUrl,
          shortCode: nanoid(8),
        });

        created.push({ channel, fullUrl });
      }

      return { count: created.length, links: created };
    }),
});
