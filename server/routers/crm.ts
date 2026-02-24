import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { leads, pipelineStages, leadActivities, clients } from "../../drizzle/schema";
import { eq, and, desc, sql, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";

export const crmRouter = router({
  // ─── Pipeline Stages ─────────────────────────────────────────────────────
  getStages: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select().from(pipelineStages)
      .where(eq(pipelineStages.userId, ctx.user.id))
      .orderBy(asc(pipelineStages.position));
    if (rows.length === 0) {
      // Create default stages
      const defaults = [
        { name: "Novo", color: "#6366f1", position: 0 },
        { name: "Contactado", color: "#f59e0b", position: 1 },
        { name: "Follow Up", color: "#f97316", position: 2 },
        { name: "Qualificado", color: "#3b82f6", position: 3 },
        { name: "Proposta", color: "#8b5cf6", position: 4 },
        { name: "Negociação", color: "#ec4899", position: 5 },
        { name: "Fechado", color: "#10b981", position: 6 },
        { name: "Perdido", color: "#ef4444", position: 7 },
      ];
      for (const s of defaults) {
        await db.insert(pipelineStages).values({ ...s, userId: ctx.user.id });
      }
      return await db.select().from(pipelineStages)
        .where(eq(pipelineStages.userId, ctx.user.id))
        .orderBy(asc(pipelineStages.position));
    }
    return rows;
  }),

  // ─── Leads CRUD ──────────────────────────────────────────────────────────
  listLeads: protectedProcedure
    .input(z.object({
      stage: z.string().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(leads.userId, ctx.user.id)];
      if (input?.stage) conditions.push(eq(leads.stage, input.stage));
      const rows = await db.select().from(leads)
        .where(and(...conditions))
        .orderBy(desc(leads.createdAt));
      if (input?.search) {
        const s = input.search.toLowerCase();
        return rows.filter(r =>
          r.name.toLowerCase().includes(s) ||
          (r.email?.toLowerCase().includes(s)) ||
          (r.company?.toLowerCase().includes(s))
        );
      }
      return rows;
    }),

  getLead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(leads)
        .where(and(eq(leads.id, input.id), eq(leads.userId, ctx.user.id)));
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND" });
      return rows[0];
    }),

  createLead: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
      position: z.string().optional(),
      source: z.string().optional(),
      stage: z.string().optional(),
      score: z.number().optional(),
      value: z.number().optional(),
      tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
      clientId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const result = await db.insert(leads).values({
        ...input,
        userId: ctx.user.id,
        tags: input.tags || [],
      });
      return { id: result[0].insertId };
    }),

  updateLead: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
      position: z.string().optional(),
      source: z.string().optional(),
      stage: z.string().optional(),
      score: z.number().optional(),
      value: z.number().optional(),
      tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...data } = input;
      await db.update(leads).set(data)
        .where(and(eq(leads.id, id), eq(leads.userId, ctx.user.id)));
      return { success: true };
    }),

  moveLead: protectedProcedure
    .input(z.object({ id: z.number(), stage: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(leads).set({ stage: input.stage })
        .where(and(eq(leads.id, input.id), eq(leads.userId, ctx.user.id)));
      return { success: true };
    }),

  markFollowUp: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get current lead state
      const rows = await db.select().from(leads)
        .where(and(eq(leads.id, input.id), eq(leads.userId, ctx.user.id)));
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND" });
      const lead = rows[0];

      const currentCount = (lead.followUpCount ?? 0) + 1;
      const existingTags = (lead.tags as string[] | null) ?? [];

      // Remove old follow-up count tags and add new one
      const cleanedTags = existingTags.filter(t => !t.startsWith("follow-up-"));
      if (currentCount > 1) cleanedTags.push(`follow-up-${currentCount}x`);

      // Ensure "Follow Up" stage exists for this user, create if needed
      const stageRows = await db.select().from(pipelineStages)
        .where(and(eq(pipelineStages.userId, ctx.user.id), eq(pipelineStages.name, "Follow Up")));
      if (stageRows.length === 0) {
        await db.insert(pipelineStages).values({
          userId: ctx.user.id,
          name: "Follow Up",
          color: "#f97316",
          position: 99,
        });
      }

      await db.update(leads).set({
        stage: "Follow Up",
        followUpCount: currentCount,
        lastContactAt: new Date(),
        tags: cleanedTags,
      }).where(and(eq(leads.id, input.id), eq(leads.userId, ctx.user.id)));

      return { success: true, followUpCount: currentCount };
    }),

  deleteLead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(leads)
        .where(and(eq(leads.id, input.id), eq(leads.userId, ctx.user.id)));
      return { success: true };
    }),

  // ─── Lead Activities ─────────────────────────────────────────────────────
  getActivities: protectedProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(leadActivities)
        .where(and(eq(leadActivities.leadId, input.leadId), eq(leadActivities.userId, ctx.user.id)))
        .orderBy(desc(leadActivities.createdAt));
    }),

  addActivity: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      type: z.string(),
      title: z.string(),
      description: z.string().optional(),
      scheduledAt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [lead] = await db
        .select({ id: leads.id })
        .from(leads)
        .where(and(eq(leads.id, input.leadId), eq(leads.userId, ctx.user.id)))
        .limit(1);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND" });

      await db.insert(leadActivities).values({
        ...input,
        userId: ctx.user.id,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      });
      // Update lastContactAt on lead
      await db.update(leads).set({ lastContactAt: new Date() })
        .where(and(eq(leads.id, input.leadId), eq(leads.userId, ctx.user.id)));
      return { success: true };
    }),

  // ─── Lead Stats ──────────────────────────────────────────────────────────
  stats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { total: 0, new: 0, qualified: 0, closed: 0, totalValue: 0 };
    const allLeads = await db.select().from(leads)
      .where(eq(leads.userId, ctx.user.id));
    return {
      total: allLeads.length,
      new: allLeads.filter(l => l.stage === "Novo" || l.stage === "new").length,
      qualified: allLeads.filter(l => l.stage === "Qualificado").length,
      closed: allLeads.filter(l => l.stage === "Fechado").length,
      totalValue: allLeads.reduce((sum, l) => sum + (l.value || 0), 0),
    };
  }),

  // ─── AI: Generate Ideal Lead List ────────────────────────────────────────
  generateIdealLeads: protectedProcedure
    .input(z.object({
      clientId: z.number().optional(),
      industry: z.string(),
      targetAudience: z.string(),
      location: z.string().optional(),
      count: z.number().min(1).max(20).default(10),
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

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Você é um especialista em geração de leads B2B e B2C. Gere uma lista de leads ideais (fictícios mas realistas) baseados no ICP fornecido. Para cada lead, forneça: name, email, phone, company, position, source, score (0-100), value (em centavos BRL), tags (array de strings). Responda APENAS em JSON válido como array de objetos.`,
          },
          {
            role: "user",
            content: `Gere ${input.count} leads ideais para:
Indústria: ${input.industry}
Público-alvo: ${input.targetAudience}
Localização: ${input.location || "Brasil"}

Retorne um JSON array com os leads. Cada lead deve ter: name, email, phone, company, position, source, score, value, tags.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "lead_list",
            strict: true,
            schema: {
              type: "object",
              properties: {
                leads: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      email: { type: "string" },
                      phone: { type: "string" },
                      company: { type: "string" },
                      position: { type: "string" },
                      source: { type: "string" },
                      score: { type: "number" },
                      value: { type: "number" },
                      tags: { type: "array", items: { type: "string" } },
                    },
                    required: ["name", "email", "phone", "company", "position", "source", "score", "value", "tags"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["leads"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response.choices?.[0]?.message?.content;
      if (!rawContent) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI failed to generate leads" });
      const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
      const parsed = JSON.parse(content);
      const generatedLeads = parsed.leads || [];

      // Insert all generated leads
      const insertedIds: number[] = [];
      for (const lead of generatedLeads) {
        const result = await db.insert(leads).values({
          userId: ctx.user.id,
          clientId: input.clientId || null,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          position: lead.position,
          source: lead.source || "AI Generated",
          stage: "Novo",
          score: lead.score || 50,
          value: lead.value || 0,
          tags: lead.tags || ["ai-generated"],
          aiGenerated: true,
        });
        insertedIds.push(result[0].insertId);
      }

      return { count: insertedIds.length, ids: insertedIds };
    }),
});
