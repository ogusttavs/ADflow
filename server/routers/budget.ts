import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { budgetAllocations, performanceMetrics } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";

export const budgetRouter = router({
  list: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(budgetAllocations)
        .where(and(eq(budgetAllocations.clientId, input.clientId), eq(budgetAllocations.userId, ctx.user.id)))
        .orderBy(desc(budgetAllocations.createdAt));
    }),

  save: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      month: z.string(),
      totalBudget: z.number(),
      allocations: z.record(z.string(), z.number()),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const result = await db.insert(budgetAllocations).values({
        clientId: input.clientId,
        userId: ctx.user.id,
        month: input.month,
        totalBudget: input.totalBudget,
        allocations: input.allocations,
      });
      return { id: result[0].insertId };
    }),

  optimizeWithAI: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      totalBudget: z.number(),
      currentAllocations: z.record(z.string(), z.number()),
      objective: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get performance data
      const metrics = await db.select().from(performanceMetrics)
        .where(eq(performanceMetrics.clientId, input.clientId));

      const platformPerf: Record<string, { impressions: number; clicks: number; conversions: number; spend: number; revenue: number }> = {};
      for (const m of metrics) {
        if (!platformPerf[m.platform]) platformPerf[m.platform] = { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 };
        platformPerf[m.platform].impressions += m.impressions || 0;
        platformPerf[m.platform].clicks += m.clicks || 0;
        platformPerf[m.platform].conversions += m.conversions || 0;
        platformPerf[m.platform].spend += m.spend || 0;
        platformPerf[m.platform].revenue += m.revenue || 0;
      }

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "Você é um especialista em otimização de orçamento de mídia paga. Analise a performance por canal e sugira a melhor distribuição de budget. Responda em JSON." },
          { role: "user", content: `Budget total: R$ ${(input.totalBudget / 100).toFixed(2)}\nAlocação atual: ${JSON.stringify(input.currentAllocations)}\nPerformance por plataforma: ${JSON.stringify(platformPerf)}\nObjetivo: ${input.objective || "Maximizar conversões"}\n\nSugira nova alocação e justificativa.` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "budget_optimization",
            strict: true,
            schema: {
              type: "object",
              properties: {
                suggestedAllocations: { type: "object", additionalProperties: { type: "number" } },
                reasoning: { type: "string" },
                expectedImpact: { type: "string" },
              },
              required: ["suggestedAllocations", "reasoning", "expectedImpact"],
              additionalProperties: false,
            },
          },
        },
      });

      const raw = response.choices?.[0]?.message?.content;
      const content = typeof raw === "string" ? raw : JSON.stringify(raw);
      const parsed = JSON.parse(content || "{}");

      return {
        suggestedAllocations: parsed.suggestedAllocations || {},
        reasoning: parsed.reasoning || "",
        expectedImpact: parsed.expectedImpact || "",
      };
    }),
});
