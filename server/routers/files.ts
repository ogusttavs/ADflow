import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { fileAttachments } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export const filesRouter = router({
  upload: protectedProcedure
    .input(z.object({
      entityType: z.enum(["financeiro_receipt", "client_creative", "client_document"]),
      entityId: z.number().optional(), // clientId or transactionId
      personType: z.enum(["cpf", "cnpj"]).optional(),
      originalName: z.string().min(1),
      mimeType: z.string().min(1),
      size: z.number().max(MAX_SIZE, "Arquivo muito grande (máx 10 MB)"),
      base64Content: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(fileAttachments).values({
        userId: ctx.user.id,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        personType: input.personType ?? null,
        originalName: input.originalName,
        mimeType: input.mimeType,
        size: input.size,
        base64Content: input.base64Content,
        description: input.description ?? null,
      });
      return { success: true };
    }),

  list: protectedProcedure
    .input(z.object({
      entityType: z.enum(["financeiro_receipt", "client_creative", "client_document"]),
      entityId: z.number().optional(),
      personType: z.enum(["cpf", "cnpj"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [
        eq(fileAttachments.userId, ctx.user.id),
        eq(fileAttachments.entityType, input.entityType),
      ];
      if (input.entityId !== undefined) conditions.push(eq(fileAttachments.entityId, input.entityId));
      if (input.personType) conditions.push(eq(fileAttachments.personType, input.personType));

      const rows = await db.select({
        id: fileAttachments.id,
        originalName: fileAttachments.originalName,
        mimeType: fileAttachments.mimeType,
        size: fileAttachments.size,
        description: fileAttachments.description,
        createdAt: fileAttachments.createdAt,
        entityId: fileAttachments.entityId,
        personType: fileAttachments.personType,
      }).from(fileAttachments).where(and(...conditions));
      return rows;
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [file] = await db.select().from(fileAttachments)
        .where(and(eq(fileAttachments.id, input.id), eq(fileAttachments.userId, ctx.user.id)));
      if (!file) throw new TRPCError({ code: "NOT_FOUND" });
      return file;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(fileAttachments)
        .where(and(eq(fileAttachments.id, input.id), eq(fileAttachments.userId, ctx.user.id)));
      return { success: true };
    }),
});
