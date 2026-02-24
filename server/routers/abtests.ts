import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { abTests } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";

export const abTestsRouter = router({
  list: protectedProcedure
    .input(z.object({ campaignId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(abTests.userId, ctx.user.id)];
      if (input?.campaignId) conditions.push(eq(abTests.campaignId, input.campaignId));
      return await db.select().from(abTests).where(and(...conditions)).orderBy(desc(abTests.createdAt));
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(abTests)
        .where(and(eq(abTests.id, input.id), eq(abTests.userId, ctx.user.id)));
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND" });
      return rows[0];
    }),

  generateVariants: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      name: z.string(),
      channel: z.string(),
      originalHeadline: z.string(),
      originalBody: z.string(),
      originalCta: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "Você é um copywriter especialista em testes A/B. Dado um texto original (Variante A), crie uma Variante B alternativa que teste uma abordagem diferente. Responda em JSON." },
          { role: "user", content: `Canal: ${input.channel}\nVariante A:\nHeadline: ${input.originalHeadline}\nBody: ${input.originalBody}\nCTA: ${input.originalCta}\n\nCrie a Variante B com abordagem diferente.` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "ab_variant",
            strict: true,
            schema: {
              type: "object",
              properties: {
                headline: { type: "string" },
                body: { type: "string" },
                cta: { type: "string" },
                reasoning: { type: "string" },
              },
              required: ["headline", "body", "cta", "reasoning"],
              additionalProperties: false,
            },
          },
        },
      });

      const raw = response.choices?.[0]?.message?.content;
      const content = typeof raw === "string" ? raw : JSON.stringify(raw);
      const variantB = JSON.parse(content || "{}");

      const result = await db.insert(abTests).values({
        campaignId: input.campaignId,
        userId: ctx.user.id,
        name: input.name,
        channel: input.channel,
        status: "draft",
        variantAHeadline: input.originalHeadline,
        variantABody: input.originalBody,
        variantACta: input.originalCta,
        variantBHeadline: variantB.headline || "",
        variantBBody: variantB.body || "",
        variantBCta: variantB.cta || "",
        aiInsights: variantB.reasoning || "",
      });

      return { id: result[0].insertId };
    }),

  updateMetrics: protectedProcedure
    .input(z.object({
      id: z.number(),
      variantAImpressions: z.number().optional(),
      variantAClicks: z.number().optional(),
      variantAConversions: z.number().optional(),
      variantBImpressions: z.number().optional(),
      variantBClicks: z.number().optional(),
      variantBConversions: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...data } = input;
      await db.update(abTests).set(data)
        .where(and(eq(abTests.id, id), eq(abTests.userId, ctx.user.id)));
      return { success: true };
    }),

  declareWinner: protectedProcedure
    .input(z.object({ id: z.number(), winner: z.enum(["A", "B"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(abTests).set({ winner: input.winner, status: "completed", endedAt: new Date() })
        .where(and(eq(abTests.id, input.id), eq(abTests.userId, ctx.user.id)));
      return { success: true };
    }),
});
