import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { diaryEntries } from "../../drizzle/schema";
import { eq, and, like, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const diaryRouter = router({
  list: protectedProcedure
    .input(z.object({ month: z.string().optional() })) // YYYY-MM
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select({
        id: diaryEntries.id,
        date: diaryEntries.date,
        mood: diaryEntries.mood,
        content: diaryEntries.content,
        createdAt: diaryEntries.createdAt,
        updatedAt: diaryEntries.updatedAt,
      }).from(diaryEntries)
        .where(eq(diaryEntries.userId, ctx.user.id))
        .orderBy(desc(diaryEntries.date));

      if (input.month) {
        return rows.filter(r => r.date.startsWith(input.month!));
      }
      return rows;
    }),

  getEntry: protectedProcedure
    .input(z.object({ date: z.string() })) // YYYY-MM-DD
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const [entry] = await db.select().from(diaryEntries)
        .where(and(eq(diaryEntries.userId, ctx.user.id), eq(diaryEntries.date, input.date)));
      return entry ?? null;
    }),

  upsert: protectedProcedure
    .input(z.object({
      date: z.string(), // YYYY-MM-DD
      content: z.string().min(1),
      mood: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [existing] = await db.select({ id: diaryEntries.id })
        .from(diaryEntries)
        .where(and(eq(diaryEntries.userId, ctx.user.id), eq(diaryEntries.date, input.date)));

      if (existing) {
        await db.update(diaryEntries)
          .set({ content: input.content, mood: input.mood ?? null })
          .where(eq(diaryEntries.id, existing.id));
      } else {
        await db.insert(diaryEntries).values({
          userId: ctx.user.id,
          date: input.date,
          content: input.content,
          mood: input.mood ?? null,
        });
      }
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(diaryEntries)
        .where(and(eq(diaryEntries.id, input.id), eq(diaryEntries.userId, ctx.user.id)));
      return { success: true };
    }),
});
