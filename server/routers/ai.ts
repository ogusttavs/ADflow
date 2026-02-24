import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { campaignCreatives, campaigns } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import { generateImage } from "../_core/imageGeneration";
import { storagePut } from "../storage";

export const aiRouter = router({
  // Generate creative image using built-in image generation
  generateCreative: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      prompt: z.string(),
      style: z.enum(["minimalist", "bold", "elegant", "playful", "corporate", "creative"]).default("minimalist"),
      channel: z.string().optional(),
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

      // Enhance prompt for marketing
      const enhancedPrompt = `${input.prompt}, ${input.style} style, professional marketing visual, high quality, ${input.channel ?? "social media"} format`;

      const { url: imageUrl } = await generateImage({ prompt: enhancedPrompt });

      // Store creative in DB
      const [result] = await db.insert(campaignCreatives).values({
        campaignId: input.campaignId,
        type: "image",
        channel: input.channel ?? null,
        imageUrl,
        prompt: enhancedPrompt,
        approved: false,
      });

      return { id: (result as any).insertId, imageUrl };
    }),

  // Generate copy suggestion for a specific channel
  generateCopySuggestion: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      channel: z.string(),
      additionalContext: z.string().optional(),
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

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "Você é um copywriter especialista. Crie textos persuasivos para marketing digital em português do Brasil. Responda em JSON.",
          },
          {
            role: "user",
            content: `Crie uma copy para ${input.channel} para a campanha "${campaign.title}".
Estratégia: ${campaign.strategy ?? "N/A"}
CTA: ${campaign.callToAction ?? "N/A"}
${input.additionalContext ? `Contexto adicional: ${input.additionalContext}` : ""}

Responda em JSON: {"headline": "...", "body": "...", "hashtags": "...", "cta": "..."}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "copy_suggestion",
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

      return JSON.parse(response.choices[0].message.content as string);
    }),

  // Freepik search (requires API key from user)
  searchFreepikAssets: protectedProcedure
    .input(z.object({
      query: z.string(),
      type: z.enum(["photo", "vector", "psd"]).default("photo"),
      limit: z.number().default(10),
    }))
    .mutation(async ({ ctx, input }) => {
      const freepikKey = process.env.FREEPIK_API_KEY;
      if (!freepikKey) {
        return {
          assets: [],
          message: "Configure sua chave de API do Freepik nas integrações para buscar assets.",
        };
      }

      try {
        const response = await fetch(
          `https://api.freepik.com/v1/resources?locale=pt_BR&page=1&limit=${input.limit}&order=relevance&term=${encodeURIComponent(input.query)}&filters[content_type][photo]=${input.type === "photo" ? 1 : 0}&filters[content_type][vector]=${input.type === "vector" ? 1 : 0}`,
          {
            headers: {
              "x-freepik-api-key": freepikKey,
              "Accept-Language": "pt-BR",
            },
          }
        );
        const data = await response.json() as any;
        return { assets: data.data ?? [], message: null };
      } catch (error) {
        return { assets: [], message: "Erro ao buscar assets do Freepik." };
      }
    }),
});
