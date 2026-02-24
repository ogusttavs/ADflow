import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { whatsappSessions, clients, campaigns } from "../../drizzle/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";

export const whatsappRouter = router({
  // Get webhook config info
  getConfig: protectedProcedure.query(async () => {
    return {
      webhookUrl: "/api/whatsapp/webhook",
      instructions: "Configure este URL no Meta Business Manager como webhook do WhatsApp Business API.",
    };
  }),

  // List recent sessions
  sessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const ownedClients = await db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.userId, ctx.user.id));
    const ownedClientIds = ownedClients.map(c => c.id);
    if (ownedClientIds.length === 0) return [];

    return db
      .select()
      .from(whatsappSessions)
      .where(inArray(whatsappSessions.clientId, ownedClientIds))
      .orderBy(desc(whatsappSessions.lastMessageAt))
      .limit(50);
  }),

  // Simulate a WhatsApp message for testing
  simulateMessage: protectedProcedure
    .input(z.object({
      phoneNumber: z.string(),
      message: z.string(),
      clientId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const ownedClients = await db
        .select({ id: clients.id })
        .from(clients)
        .where(eq(clients.userId, ctx.user.id));
      const ownedClientIds = new Set(ownedClients.map(c => c.id));

      let targetClientId = input.clientId;
      if (targetClientId !== undefined && !ownedClientIds.has(targetClientId)) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado" });
      }

      if (targetClientId === undefined) {
        const recentPhoneSessions = await db
          .select()
          .from(whatsappSessions)
          .where(eq(whatsappSessions.phoneNumber, input.phoneNumber))
          .orderBy(desc(whatsappSessions.lastMessageAt))
          .limit(10);
        const ownedSession = recentPhoneSessions.find(
          session => session.clientId !== null && ownedClientIds.has(session.clientId)
        );
        targetClientId = ownedSession?.clientId ?? undefined;
      }

      if (targetClientId === undefined) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Informe o cliente da conversa para iniciar a sessão de WhatsApp",
        });
      }

      // Get or create session scoped by phoneNumber + owned clientId
      let [session] = await db
        .select()
        .from(whatsappSessions)
        .where(and(eq(whatsappSessions.phoneNumber, input.phoneNumber), eq(whatsappSessions.clientId, targetClientId)))
        .orderBy(desc(whatsappSessions.lastMessageAt))
        .limit(1);

      if (!session) {
        const [result] = await db.insert(whatsappSessions).values({
          phoneNumber: input.phoneNumber,
          clientId: targetClientId,
          state: "idle",
          context: {},
        });
        const [newSession] = await db
          .select()
          .from(whatsappSessions)
          .where(eq(whatsappSessions.id, (result as any).insertId))
          .limit(1);
        session = newSession;
      }
      if (!session) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get client context if available
      let clientContext = "";
      const [client] = await db
        .select()
        .from(clients)
        .where(and(eq(clients.id, targetClientId), eq(clients.userId, ctx.user.id)))
        .limit(1);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado" });
      clientContext = `Cliente: ${client.name} (${client.company ?? "N/A"})`;

      // Process message with AI
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Você é um assistente de marketing digital inteligente que opera via WhatsApp para uma agência de marketing.
Seu papel é ajudar clientes a solicitar e criar campanhas de marketing.

Estado atual da conversa: ${session.state}
${clientContext}

Fluxo de criação de campanha:
1. Cumprimentar e perguntar o objetivo da campanha
2. Perguntar quais canais (Instagram, Facebook, TikTok, LinkedIn)
3. Perguntar a data desejada para publicação
4. Confirmar e iniciar a geração automática

Responda de forma amigável, profissional e em português do Brasil.
Quando o usuário fornecer todas as informações necessárias, responda com JSON no formato:
{"action": "create_campaign", "title": "...", "objective": "...", "channels": [...], "scheduledDate": "..."}

Para outras mensagens, responda normalmente em texto.`,
          },
          {
            role: "user",
            content: input.message,
          },
        ],
      });

      const aiReply = response.choices[0].message.content as string;

      // Check if AI wants to create a campaign
      let campaignCreated = false;
      try {
        const parsed = JSON.parse(aiReply);
        if (parsed.action === "create_campaign") {
          const [result] = await db.insert(campaigns).values({
            clientId: targetClientId,
            userId: ctx.user.id,
            title: parsed.title,
            objective: parsed.objective,
            requestedVia: "whatsapp",
            status: "pending",
          });
          campaignCreated = true;
          await notifyOwner({
            title: "Nova solicitação via WhatsApp",
            content: `Campanha "${parsed.title}" solicitada via WhatsApp pelo número ${input.phoneNumber}.`,
          });
          // Update session
          await db.update(whatsappSessions).set({
            state: "completed",
            campaignId: (result as any).insertId,
            lastMessageAt: new Date(),
          }).where(eq(whatsappSessions.id, session.id));
        }
      } catch {
        // Not JSON, normal response
      }

      // Update session
      await db.update(whatsappSessions).set({
        lastMessageAt: new Date(),
        state: campaignCreated ? "completed" : session.state,
      }).where(eq(whatsappSessions.id, session.id));

      return {
        reply: campaignCreated
          ? "✅ Perfeito! Sua campanha foi registrada e nossa equipe de IA já está trabalhando nela. Você receberá uma notificação quando estiver pronta para revisão!"
          : aiReply,
        campaignCreated,
      };
    }),
});
