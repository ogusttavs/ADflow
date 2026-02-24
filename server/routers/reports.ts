import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { reports, campaigns, performanceMetrics, clients } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";

export const reportsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return await db.select().from(reports)
      .where(eq(reports.userId, ctx.user.id))
      .orderBy(desc(reports.createdAt));
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(reports)
        .where(and(eq(reports.id, input.id), eq(reports.userId, ctx.user.id)));
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND" });
      return rows[0];
    }),

  generate: protectedProcedure
    .input(z.object({
      clientId: z.number().optional(),
      title: z.string(),
      type: z.string().default("performance"),
      period: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      if (input.clientId) {
        const [client] = await db
          .select({ id: clients.id })
          .from(clients)
          .where(and(eq(clients.id, input.clientId), eq(clients.userId, ctx.user.id)))
          .limit(1);
        if (!client) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado" });
        }
      }

      // Gather campaign data
      const allCampaigns = await db
        .select()
        .from(campaigns)
        .where(
          input.clientId
            ? and(eq(campaigns.userId, ctx.user.id), eq(campaigns.clientId, input.clientId))
            : eq(campaigns.userId, ctx.user.id)
        );

      const metrics = input.clientId
        ? await db.select().from(performanceMetrics).where(eq(performanceMetrics.clientId, input.clientId))
        : [];

      const metricsData = {
        totalCampaigns: allCampaigns.length,
        published: allCampaigns.filter(c => c.status === "published").length,
        pending: allCampaigns.filter(c => c.status === "pending").length,
        generating: allCampaigns.filter(c => c.status === "generating").length,
        totalImpressions: metrics.reduce((s, m) => s + (m.impressions || 0), 0),
        totalClicks: metrics.reduce((s, m) => s + (m.clicks || 0), 0),
        totalConversions: metrics.reduce((s, m) => s + (m.conversions || 0), 0),
        totalSpend: metrics.reduce((s, m) => s + (m.spend || 0), 0),
        totalRevenue: metrics.reduce((s, m) => s + (m.revenue || 0), 0),
      };

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "Você é um analista de marketing digital. Gere um relatório de performance com resumo executivo e recomendações acionáveis. Responda em JSON com campos: summary (string com markdown) e recommendations (string com markdown)." },
          { role: "user", content: `Dados de performance:\n${JSON.stringify(metricsData, null, 2)}\n\nPeríodo: ${input.period || "Último mês"}\nTipo: ${input.type}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "report",
            strict: true,
            schema: {
              type: "object",
              properties: {
                summary: { type: "string" },
                recommendations: { type: "string" },
              },
              required: ["summary", "recommendations"],
              additionalProperties: false,
            },
          },
        },
      });

      const raw = response.choices?.[0]?.message?.content;
      const content = typeof raw === "string" ? raw : JSON.stringify(raw);
      const parsed = JSON.parse(content || "{}");

      const result = await db.insert(reports).values({
        userId: ctx.user.id,
        clientId: input.clientId || null,
        title: input.title,
        type: input.type,
        period: input.period || "Último mês",
        metricsData,
        aiSummary: parsed.summary || "",
        aiRecommendations: parsed.recommendations || "",
      });

      return { id: result[0].insertId };
    }),
});
