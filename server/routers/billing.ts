import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { clientBilling, clientPaymentRecords, clients } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const billingRouter = router({
  // ─── Billing configs ─────────────────────────────────────────────────────────
  listBillings: protectedProcedure
    .input(z.object({ clientId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(clientBilling.userId, ctx.user.id)];
      if (input.clientId) conditions.push(eq(clientBilling.clientId, input.clientId));
      return db.select().from(clientBilling).where(and(...conditions)).orderBy(clientBilling.billingDay);
    }),

  createBilling: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      billingDay: z.number().min(1).max(31),
      amount: z.number().min(1),
      description: z.string().min(1),
      personType: z.enum(["cpf", "cnpj"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(clientBilling).values({ ...input, userId: ctx.user.id });
      return { success: true };
    }),

  updateBilling: protectedProcedure
    .input(z.object({
      id: z.number(),
      billingDay: z.number().min(1).max(31).optional(),
      amount: z.number().optional(),
      description: z.string().optional(),
      active: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...data } = input;
      await db.update(clientBilling).set(data)
        .where(and(eq(clientBilling.id, id), eq(clientBilling.userId, ctx.user.id)));
      return { success: true };
    }),

  deleteBilling: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(clientBilling)
        .where(and(eq(clientBilling.id, input.id), eq(clientBilling.userId, ctx.user.id)));
      return { success: true };
    }),

  // ─── Payment records ──────────────────────────────────────────────────────────
  listPayments: protectedProcedure
    .input(z.object({ clientId: z.number().optional(), month: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(clientPaymentRecords.userId, ctx.user.id)];
      if (input.clientId) conditions.push(eq(clientPaymentRecords.clientId, input.clientId));
      if (input.month) conditions.push(eq(clientPaymentRecords.month, input.month));
      return db.select().from(clientPaymentRecords)
        .where(and(...conditions))
        .orderBy(clientPaymentRecords.dueDate);
    }),

  // Ensures payment records exist for current month — call when opening billing view
  generateMonthPayments: protectedProcedure
    .input(z.object({ month: z.string() })) // YYYY-MM
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const activeBillings = await db.select().from(clientBilling)
        .where(and(eq(clientBilling.userId, ctx.user.id), eq(clientBilling.active, true)));

      const existing = await db.select().from(clientPaymentRecords)
        .where(and(
          eq(clientPaymentRecords.userId, ctx.user.id),
          eq(clientPaymentRecords.month, input.month),
        ));
      const existingBillingIds = new Set(existing.map(r => r.billingId));

      const toInsert = activeBillings
        .filter(b => !existingBillingIds.has(b.id))
        .map(b => {
          const [year, mon] = input.month.split("-").map(Number);
          const lastDay = new Date(year, mon, 0).getDate();
          const day = Math.min(b.billingDay, lastDay);
          const dueDate = `${input.month}-${String(day).padStart(2, "0")}`;
          return {
            userId: ctx.user.id,
            clientId: b.clientId,
            billingId: b.id,
            month: input.month,
            dueDate,
            amount: b.amount,
            status: "pending" as const,
          };
        });

      if (toInsert.length > 0) {
        await db.insert(clientPaymentRecords).values(toInsert);
      }
      return { created: toInsert.length };
    }),

  markPaid: protectedProcedure
    .input(z.object({ id: z.number(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [record] = await db.select().from(clientPaymentRecords)
        .where(and(eq(clientPaymentRecords.id, input.id), eq(clientPaymentRecords.userId, ctx.user.id)));
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });

      await db.update(clientPaymentRecords).set({ status: "paid", paidAt: new Date(), notes: input.notes })
        .where(eq(clientPaymentRecords.id, input.id));

      // Check if client still has any overdue payments; if not, reset paymentStatus to "ok"
      const overdueCount = await db.select().from(clientPaymentRecords)
        .where(and(
          eq(clientPaymentRecords.clientId, record.clientId),
          eq(clientPaymentRecords.userId, ctx.user.id),
          eq(clientPaymentRecords.status, "overdue"),
        ));
      if (overdueCount.length === 0) {
        await db.update(clients).set({ paymentStatus: "ok" })
          .where(eq(clients.id, record.clientId));
      }
      return { success: true };
    }),

  markOverdue: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [record] = await db.select().from(clientPaymentRecords)
        .where(and(eq(clientPaymentRecords.id, input.id), eq(clientPaymentRecords.userId, ctx.user.id)));
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });

      await db.update(clientPaymentRecords).set({ status: "overdue" })
        .where(eq(clientPaymentRecords.id, input.id));

      // Flag the client
      await db.update(clients).set({ paymentStatus: "overdue" })
        .where(eq(clients.id, record.clientId));
      return { success: true };
    }),

  // Returns payments due today (for morning briefing)
  todaysDuePayments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const today = new Date().toISOString().slice(0, 10);
    const payments = await db.select().from(clientPaymentRecords)
      .where(and(
        eq(clientPaymentRecords.userId, ctx.user.id),
        eq(clientPaymentRecords.dueDate, today),
        eq(clientPaymentRecords.status, "pending"),
      ));
    if (payments.length === 0) return [];

    // Enrich with client names
    const allClients = await db.select().from(clients).where(eq(clients.userId, ctx.user.id));
    const clientMap = new Map(allClients.map(c => [c.id, c]));
    return payments.map(p => ({
      ...p,
      clientName: clientMap.get(p.clientId)?.name ?? "Cliente desconhecido",
    }));
  }),
});
