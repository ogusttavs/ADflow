import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { transcribeAudio } from "../_core/voiceTranscription";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

export const voiceRouter = router({
  // Upload audio buffer and get a URL back
  uploadAudio: protectedProcedure
    .input(z.object({
      audioBase64: z.string(),
      mimeType: z.string().default("audio/webm"),
    }))
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.audioBase64, "base64");
      const sizeMB = buffer.length / (1024 * 1024);
      if (sizeMB > 16) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Áudio excede 16MB" });
      }
      const ext = input.mimeType.includes("webm") ? "webm" : input.mimeType.includes("wav") ? "wav" : "mp3";
      const key = `voice/${ctx.user.id}/${nanoid()}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url, sizeKB: Math.round(buffer.length / 1024) };
    }),

  // Transcribe audio from URL - with detailed error info
  transcribe: protectedProcedure
    .input(z.object({
      audioUrl: z.string(),
      language: z.string().optional(),
      prompt: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await transcribeAudio({
          audioUrl: input.audioUrl,
          language: input.language ?? "pt",
          prompt: input.prompt,
        });

        if ("error" in result) {
          // Return error details instead of throwing - let frontend handle fallback
          console.error("[Voice] Transcription error:", result.error, result.details);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: result.error,
            cause: { ...result, audioUrl: input.audioUrl },
          });
        }

        return { text: result.text, language: result.language, duration: result.duration };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Voice] Unexpected transcription error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha inesperada na transcrição",
          cause: err,
        });
      }
    }),
});
