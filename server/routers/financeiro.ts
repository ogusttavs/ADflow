import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { financeiroTransactions, financeiroRecurring, financeiroCategories, userLinks } from "../../drizzle/schema";
import { eq, and, desc, like, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Pre-defined categories per person type
const DEFAULT_CATEGORIES = {
  cpf: {
    income: ["Salário", "Freelance", "Dividendos", "Aluguel", "Investimentos", "Outros"],
    expense: ["Moradia", "Alimentação", "Saúde", "Transporte", "Educação", "Lazer", "Vestuário", "Serviços", "Outros"],
  },
  cnpj: {
    income: ["Venda de Serviços", "Venda de Produtos", "Consultoria", "Comissões", "Outros"],
    expense: ["Folha de Pagamento", "Fornecedores", "Marketing", "Aluguel", "Impostos", "Software/Tech", "Equipamentos", "Outros"],
  },
};

// Validate that currentUserId has accepted access to viewAsUserId's finances for personType
async function validateFinanceAccess(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  currentUserId: number,
  viewAsUserId: number,
  personType: "cpf" | "cnpj",
  requireEdit = false,
) {
  const links = await db.select().from(userLinks)
    .where(and(
      eq(userLinks.ownerId, viewAsUserId),
      eq(userLinks.linkedUserId, currentUserId),
      eq(userLinks.status, "accepted"),
    ));
  const link = links.find(l => (l.sharePersonTypes as string[]).includes(personType));
  if (!link) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
  if (requireEdit && link.permission !== "edit") throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão de edição" });
  return link;
}

export const financeiroRouter = router({
  list: protectedProcedure
    .input(z.object({
      personType: z.enum(["cpf", "cnpj"]),
      search: z.string().optional(),
      viewAsUserId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      let targetUserId = ctx.user.id;
      if (input.viewAsUserId && input.viewAsUserId !== ctx.user.id) {
        await validateFinanceAccess(db, ctx.user.id, input.viewAsUserId, input.personType);
        targetUserId = input.viewAsUserId;
      }

      const rows = await db.select().from(financeiroTransactions)
        .where(and(
          eq(financeiroTransactions.userId, targetUserId),
          eq(financeiroTransactions.personType, input.personType),
        ))
        .orderBy(desc(financeiroTransactions.date));

      if (input.search) {
        const q = input.search.toLowerCase();
        return rows.filter(r =>
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
        );
      }
      return rows;
    }),

  create: protectedProcedure
    .input(z.object({
      type: z.enum(["income", "expense"]),
      personType: z.enum(["cpf", "cnpj"]),
      category: z.string().min(1),
      description: z.string().min(1),
      amount: z.number().min(1),
      date: z.string(),
      receiptFileId: z.number().optional(),
      viewAsUserId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      let targetUserId = ctx.user.id;
      if (input.viewAsUserId && input.viewAsUserId !== ctx.user.id) {
        await validateFinanceAccess(db, ctx.user.id, input.viewAsUserId, input.personType, true);
        targetUserId = input.viewAsUserId;
      }

      const { viewAsUserId: _, ...rest } = input;
      await db.insert(financeiroTransactions).values({
        ...rest,
        receiptFileId: input.receiptFileId ?? null,
        userId: targetUserId,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      type: z.enum(["income", "expense"]).optional(),
      category: z.string().optional(),
      description: z.string().optional(),
      amount: z.number().optional(),
      date: z.string().optional(),
      receiptFileId: z.number().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...data } = input;
      await db.update(financeiroTransactions).set(data)
        .where(and(eq(financeiroTransactions.id, id), eq(financeiroTransactions.userId, ctx.user.id)));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(financeiroTransactions)
        .where(and(eq(financeiroTransactions.id, input.id), eq(financeiroTransactions.userId, ctx.user.id)));
      return { success: true };
    }),

  summary: protectedProcedure
    .input(z.object({ personType: z.enum(["cpf", "cnpj"]), month: z.string(), viewAsUserId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { income: 0, expense: 0, balance: 0, byCategory: [] as { category: string; total: number; type: string }[] };

      let targetUserId = ctx.user.id;
      if (input.viewAsUserId && input.viewAsUserId !== ctx.user.id) {
        await validateFinanceAccess(db, ctx.user.id, input.viewAsUserId, input.personType);
        targetUserId = input.viewAsUserId;
      }

      const all = await db.select().from(financeiroTransactions)
        .where(and(
          eq(financeiroTransactions.userId, targetUserId),
          eq(financeiroTransactions.personType, input.personType),
        ));
      const monthTx = all.filter(t => t.date.startsWith(input.month));
      const income = monthTx.filter(t => t.type === "income").reduce((a, t) => a + t.amount, 0);
      const expense = monthTx.filter(t => t.type === "expense").reduce((a, t) => a + t.amount, 0);

      const catMap = new Map<string, { total: number; type: string }>();
      for (const t of monthTx) {
        const key = `${t.type}::${t.category}`;
        const existing = catMap.get(key);
        catMap.set(key, { total: (existing?.total ?? 0) + t.amount, type: t.type });
      }
      const byCategory = Array.from(catMap.entries()).map(([key, v]) => ({
        category: key.split("::")[1],
        total: v.total,
        type: v.type,
      }));

      return { income, expense, balance: income - expense, byCategory };
    }),

  summary3months: protectedProcedure
    .input(z.object({ personType: z.enum(["cpf", "cnpj"]), viewAsUserId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      if (input.viewAsUserId) await validateFinanceAccess(db, ctx.user.id, input.viewAsUserId, input.personType);
      const targetUserId = input.viewAsUserId ?? ctx.user.id;
      const all = await db.select().from(financeiroTransactions)
        .where(and(
          eq(financeiroTransactions.userId, targetUserId),
          eq(financeiroTransactions.personType, input.personType),
        ));

      // Build last 3 months (current + 2 previous)
      const now = new Date();
      const months: string[] = [];
      for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      }

      return months.map(month => {
        const txs = all.filter(t => t.date.startsWith(month));
        const income = txs.filter(t => t.type === "income").reduce((a, t) => a + t.amount, 0);
        const expense = txs.filter(t => t.type === "expense").reduce((a, t) => a + t.amount, 0);
        return { month, income, expense, balance: income - expense };
      });
    }),

  // ─── Custom Categories ───────────────────────────────────────────────────────
  listCategories: protectedProcedure
    .input(z.object({ personType: z.enum(["cpf", "cnpj"]) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const custom = db
        ? await db.select().from(financeiroCategories)
            .where(and(
              eq(financeiroCategories.userId, ctx.user.id),
              eq(financeiroCategories.personType, input.personType),
            ))
        : [];

      const defaults = DEFAULT_CATEGORIES[input.personType];
      return {
        income: [
          ...defaults.income.map(name => ({ id: null as number | null, name, custom: false })),
          ...custom.filter(c => c.type === "income").map(c => ({ id: c.id, name: c.name, custom: true })),
        ],
        expense: [
          ...defaults.expense.map(name => ({ id: null as number | null, name, custom: false })),
          ...custom.filter(c => c.type === "expense").map(c => ({ id: c.id, name: c.name, custom: true })),
        ],
      };
    }),

  createCategory: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      type: z.enum(["income", "expense"]),
      personType: z.enum(["cpf", "cnpj"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(financeiroCategories).values({ ...input, userId: ctx.user.id });
      return { success: true };
    }),

  deleteCategory: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(financeiroCategories)
        .where(and(eq(financeiroCategories.id, input.id), eq(financeiroCategories.userId, ctx.user.id)));
      return { success: true };
    }),

  // ─── Recurring ──────────────────────────────────────────────────────────────
  listRecurring: protectedProcedure
    .input(z.object({ personType: z.enum(["cpf", "cnpj"]) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select().from(financeiroRecurring)
        .where(and(
          eq(financeiroRecurring.userId, ctx.user.id),
          eq(financeiroRecurring.personType, input.personType),
        ))
        .orderBy(financeiroRecurring.recurringDay);

      // Mark ended ones (endType=month and endMonth < current month)
      const currentMonth = new Date().toISOString().slice(0, 7);
      return rows.map(r => ({
        ...r,
        isEnded: r.endType === "month" && r.endMonth !== null && r.endMonth < currentMonth,
      }));
    }),

  createRecurring: protectedProcedure
    .input(z.object({
      type: z.enum(["income", "expense"]),
      personType: z.enum(["cpf", "cnpj"]),
      category: z.string().min(1),
      description: z.string().min(1),
      amount: z.number().min(1),
      recurringDay: z.number().min(1).max(31),
      endType: z.enum(["indefinite", "month"]).optional(),
      endMonth: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(financeiroRecurring).values({
        ...input,
        endType: input.endType ?? "indefinite",
        endMonth: input.endMonth ?? null,
        userId: ctx.user.id,
      });
      return { success: true };
    }),

  updateRecurring: protectedProcedure
    .input(z.object({
      id: z.number(),
      type: z.enum(["income", "expense"]).optional(),
      category: z.string().optional(),
      description: z.string().optional(),
      amount: z.number().optional(),
      recurringDay: z.number().min(1).max(31).optional(),
      active: z.boolean().optional(),
      endType: z.enum(["indefinite", "month"]).optional(),
      endMonth: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...data } = input;
      await db.update(financeiroRecurring).set(data)
        .where(and(eq(financeiroRecurring.id, id), eq(financeiroRecurring.userId, ctx.user.id)));
      return { success: true };
    }),

  deleteRecurring: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(financeiroRecurring)
        .where(and(eq(financeiroRecurring.id, input.id), eq(financeiroRecurring.userId, ctx.user.id)));
      return { success: true };
    }),
});
