import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { dreamItems } from "../../drizzle/schema";
import { eq, and, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB in bytes

export const dreamsRouter = router({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select({
        id: dreamItems.id,
        title: dreamItems.title,
        description: dreamItems.description,
        imageUrl: dreamItems.imageUrl,
        imageBase64: dreamItems.imageBase64,
        displayOrder: dreamItems.displayOrder,
        createdAt: dreamItems.createdAt,
      }).from(dreamItems)
        .where(eq(dreamItems.userId, ctx.user.id))
        .orderBy(asc(dreamItems.displayOrder));
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(255),
      description: z.string().optional(),
      imageBase64: z.string().optional(),
      imageUrl: z.string().url().optional().or(z.literal("")),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Find current max order
      const existing = await db.select({ displayOrder: dreamItems.displayOrder })
        .from(dreamItems).where(eq(dreamItems.userId, ctx.user.id));
      const maxOrder = existing.length > 0 ? Math.max(...existing.map(e => e.displayOrder)) : -1;

      await db.insert(dreamItems).values({
        userId: ctx.user.id,
        title: input.title,
        description: input.description ?? null,
        imageBase64: input.imageBase64 ?? null,
        imageUrl: input.imageUrl || null,
        displayOrder: maxOrder + 1,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).max(255).optional(),
      description: z.string().nullable().optional(),
      imageBase64: z.string().nullable().optional(),
      imageUrl: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...data } = input;
      await db.update(dreamItems).set(data)
        .where(and(eq(dreamItems.id, id), eq(dreamItems.userId, ctx.user.id)));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(dreamItems)
        .where(and(eq(dreamItems.id, input.id), eq(dreamItems.userId, ctx.user.id)));
      return { success: true };
    }),

  reorder: protectedProcedure
    .input(z.array(z.object({ id: z.number(), order: z.number() })))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await Promise.all(input.map(({ id, order }) =>
        db!.update(dreamItems).set({ displayOrder: order })
          .where(and(eq(dreamItems.id, id), eq(dreamItems.userId, ctx.user.id)))
      ));
      return { success: true };
    }),
});
