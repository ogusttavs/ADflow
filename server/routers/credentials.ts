import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { clientCredentials, clients } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const credentialsRouter = router({
  list: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      // Verify ownership
      const [client] = await db.select({ id: clients.id }).from(clients)
        .where(and(eq(clients.id, input.clientId), eq(clients.userId, ctx.user.id)));
      if (!client) return [];
      return db.select().from(clientCredentials)
        .where(and(eq(clientCredentials.clientId, input.clientId), eq(clientCredentials.userId, ctx.user.id)));
    }),

  create: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      service: z.string().min(1),
      username: z.string().optional(),
      password: z.string().optional(),
      url: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(clientCredentials).values({ ...input, userId: ctx.user.id });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      service: z.string().optional(),
      username: z.string().optional(),
      password: z.string().optional(),
      url: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...data } = input;
      await db.update(clientCredentials).set(data)
        .where(and(eq(clientCredentials.id, id), eq(clientCredentials.userId, ctx.user.id)));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(clientCredentials)
        .where(and(eq(clientCredentials.id, input.id), eq(clientCredentials.userId, ctx.user.id)));
      return { success: true };
    }),
});
