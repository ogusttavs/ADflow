import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { campaigns, campaignCopies, campaignCreatives, clients, clientConfigs } from "../../drizzle/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";

export const campaignsRouter = router({
  list: protectedProcedure
    .input(z.object({ clientId: z.number().optional(), status: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.userId, ctx.user.id))
        .orderBy(desc(campaigns.createdAt));
      return rows;
    }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.id, input.id), eq(campaigns.userId, ctx.user.id)))
      .limit(1);
    if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });
    const copies = await db
      .select()
      .from(campaignCopies)
      .where(eq(campaignCopies.campaignId, input.id));
    const creatives = await db
      .select()
      .from(campaignCreatives)
      .where(eq(campaignCreatives.campaignId, input.id));
    return { ...campaign, copies, creatives };
  }),

  create: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      title: z.string().min(1),
      objective: z.string().optional(),
      requestedVia: z.enum(["web", "whatsapp", "api"]).default("web"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [client] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(and(eq(clients.id, input.clientId), eq(clients.userId, ctx.user.id)))
        .limit(1);
      if (!client) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado" });
      }

      const [result] = await db.insert(campaigns).values({
        ...input,
        userId: ctx.user.id,
        status: "pending",
      });
      const id = (result as any).insertId;
      await notifyOwner({
        title: "Nova campanha criada",
        content: `Campanha "${input.title}" criada para o cliente #${input.clientId}.`,
      });
      return { id };
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.enum(["pending","generating","review","approved","scheduled","publishing","published","failed","cancelled"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(campaigns).set({ status: input.status }).where(and(eq(campaigns.id, input.id), eq(campaigns.userId, ctx.user.id)));
      return { success: true };
    }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(campaigns).where(and(eq(campaigns.id, input.id), eq(campaigns.userId, ctx.user.id)));
    return { success: true };
  }),

  generate: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      channels: z.array(z.string()).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [campaign] = await db
        .select()
        .from(campaigns)
        .where(and(eq(campaigns.id, input.campaignId), eq(campaigns.userId, ctx.user.id)))
        .limit(1);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });

      const [client] = await db
        .select()
        .from(clients)
        .where(and(eq(clients.id, campaign.clientId), eq(clients.userId, ctx.user.id)))
        .limit(1);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado" });

      const [config] = await db
        .select()
        .from(clientConfigs)
        .where(eq(clientConfigs.clientId, campaign.clientId))
        .limit(1);

      // Update status to generating
      await db.update(campaigns).set({ status: "generating" }).where(eq(campaigns.id, input.campaignId));

      const clientContext = `
Cliente: ${client?.name ?? "N/A"} (${client?.company ?? "N/A"})
Setor: ${client?.industry ?? "N/A"}
Tom de voz: ${config?.toneOfVoice ?? "professional"}
Personalidade da marca: ${config?.brandPersonality ?? "N/A"}
Público-alvo: ${config?.targetAudience ?? "N/A"}
Faixa etária: ${config?.ageRange ?? "N/A"}
Localização: ${config?.location ?? "N/A"}
Interesses: ${config?.interests ?? "N/A"}
Produtos/Serviços: ${config?.productsServices ?? "N/A"}
Proposta de valor: ${config?.mainValueProposition ?? "N/A"}
Estilo visual: ${config?.visualStyle ?? "minimalist"}
Contexto adicional: ${config?.additionalContext ?? "N/A"}
      `.trim();

      // Generate strategy
      const strategyResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Você é um especialista em marketing digital. Crie estratégias de campanha detalhadas e eficazes em português do Brasil. Responda sempre em JSON válido.`,
          },
          {
            role: "user",
            content: `Crie uma estratégia completa para a campanha "${campaign.title}".
Objetivo: ${campaign.objective ?? "Aumentar engajamento e vendas"}
Canais: ${input.channels.join(", ")}

Contexto do cliente:
${clientContext}

Responda em JSON com os campos:
{
  "strategy": "estratégia detalhada em texto",
  "keyMessages": "mensagens-chave separadas por vírgula",
  "suggestedHashtags": "hashtags separadas por espaço",
  "callToAction": "chamada para ação principal",
  "visualPrompt": "descrição visual para o criativo (em inglês, para geração de imagem)"
}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "campaign_strategy",
            strict: true,
            schema: {
              type: "object",
              properties: {
                strategy: { type: "string" },
                keyMessages: { type: "string" },
                suggestedHashtags: { type: "string" },
                callToAction: { type: "string" },
                visualPrompt: { type: "string" },
              },
              required: ["strategy", "keyMessages", "suggestedHashtags", "callToAction", "visualPrompt"],
              additionalProperties: false,
            },
          },
        },
      });

      const strategyData = JSON.parse(strategyResponse.choices[0].message.content as string);

      // Update campaign with strategy
      await db.update(campaigns).set({
        strategy: strategyData.strategy,
        keyMessages: strategyData.keyMessages,
        suggestedHashtags: strategyData.suggestedHashtags,
        callToAction: strategyData.callToAction,
        aiModel: "llm",
        status: "review",
      }).where(eq(campaigns.id, input.campaignId));

      // Generate copies for each channel
      const channelMap: Record<string, string> = {
        instagram_feed: "Instagram Feed",
        instagram_stories: "Instagram Stories",
        instagram_reels: "Instagram Reels",
        facebook_feed: "Facebook Feed",
        facebook_stories: "Facebook Stories",
        tiktok: "TikTok",
        linkedin: "LinkedIn",
        whatsapp: "WhatsApp",
      };

      const validChannels = input.channels.filter(c =>
        ["instagram_feed","instagram_stories","instagram_reels","facebook_feed","facebook_stories","tiktok","linkedin","whatsapp","email"].includes(c)
      ) as Array<"instagram_feed"|"instagram_stories"|"instagram_reels"|"facebook_feed"|"facebook_stories"|"tiktok"|"linkedin"|"whatsapp"|"email">;

      for (const channel of validChannels) {
        const copyResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um copywriter especialista em marketing digital. Crie textos persuasivos e otimizados para cada plataforma em português do Brasil. Responda sempre em JSON válido.`,
            },
            {
              role: "user",
              content: `Crie uma copy para ${channelMap[channel] ?? channel} para a campanha "${campaign.title}".

Estratégia: ${strategyData.strategy}
Mensagens-chave: ${strategyData.keyMessages}
CTA: ${strategyData.callToAction}
Tom de voz: ${config?.toneOfVoice ?? "professional"}
Público-alvo: ${config?.targetAudience ?? "N/A"}

Responda em JSON:
{
  "headline": "título/headline impactante",
  "body": "texto principal da publicação",
  "hashtags": "hashtags relevantes",
  "cta": "chamada para ação específica para este canal"
}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "campaign_copy",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  headline: { type: "string" },
                  body: { type: "string" },
                  hashtags: { type: "string" },
                  cta: { type: "string" },
                },
                required: ["headline", "body", "hashtags", "cta"],
                additionalProperties: false,
              },
            },
          },
        });

        const copyData = JSON.parse(copyResponse.choices[0].message.content as string);
        await db.insert(campaignCopies).values({
          campaignId: input.campaignId,
          channel,
          headline: copyData.headline,
          body: copyData.body,
          hashtags: copyData.hashtags,
          cta: copyData.cta,
          characterCount: (copyData.body ?? "").length,
        });
      }

      // Save visual prompt as creative placeholder
      await db.insert(campaignCreatives).values({
        campaignId: input.campaignId,
        type: "image",
        prompt: strategyData.visualPrompt,
        approved: false,
      });

      await notifyOwner({
        title: "Campanha gerada com sucesso",
        content: `A campanha "${campaign.title}" foi gerada com estratégia e ${validChannels.length} cópias para revisão.`,
      });

      return { success: true, strategy: strategyData };
    }),

  approveCopy: protectedProcedure
    .input(z.object({ copyId: z.number(), approved: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [copy] = await db
        .select({ id: campaignCopies.id, campaignId: campaignCopies.campaignId })
        .from(campaignCopies)
        .where(eq(campaignCopies.id, input.copyId))
        .limit(1);
      if (!copy) throw new TRPCError({ code: "NOT_FOUND" });

      const [campaign] = await db
        .select({ id: campaigns.id })
        .from(campaigns)
        .where(and(eq(campaigns.id, copy.campaignId), eq(campaigns.userId, ctx.user.id)))
        .limit(1);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });

      await db
        .update(campaignCopies)
        .set({ approved: input.approved })
        .where(eq(campaignCopies.id, input.copyId));

      return { success: true };
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const all = await db.select().from(campaigns).where(eq(campaigns.userId, ctx.user.id));
    const total = all.length;
    const published = all.filter(c => c.status === "published").length;
    const inReview = all.filter(c => c.status === "review").length;
    const generating = all.filter(c => c.status === "generating").length;
    const pending = all.filter(c => c.status === "pending").length;
    return { total, published, inReview, generating, pending };
  }),
});
