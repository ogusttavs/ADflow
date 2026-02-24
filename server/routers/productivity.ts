import { z } from "zod";
import { eq, and, desc, sql, gte, lte, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { habits, habitLogs, pomodoroSessions, dailyTasks, campaigns, notifications, clientPaymentRecords, clients, userLinks, users } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";

export const productivityRouter = router({
  // ─── Habits ───────────────────────────────────────────────────────────────
  listHabits: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const ownHabits = await db.select().from(habits).where(eq(habits.userId, ctx.user.id)).orderBy(habits.createdAt);

    // Fetch spouse shared habits
    const spouseLinks = await db.select().from(userLinks)
      .where(and(
        or(eq(userLinks.ownerId, ctx.user.id), eq(userLinks.linkedUserId, ctx.user.id)),
        eq(userLinks.type, "spouse"),
        eq(userLinks.status, "accepted"),
        eq(userLinks.shareProductivity, true),
      ));

    const sharedHabits: Array<typeof ownHabits[0] & { isShared: true; ownerName: string }> = [];
    for (const link of spouseLinks) {
      const otherUserId = link.ownerId === ctx.user.id ? link.linkedUserId : link.ownerId;
      const [otherUser] = await db.select({ name: users.name }).from(users).where(eq(users.id, otherUserId));
      const otherHabits = await db.select().from(habits).where(eq(habits.userId, otherUserId)).orderBy(habits.createdAt);
      for (const h of otherHabits) {
        sharedHabits.push({ ...h, isShared: true as const, ownerName: otherUser?.name ?? "Cônjuge" });
      }
    }

    return [...ownHabits.map(h => ({ ...h, isShared: false as const, ownerName: "" })), ...sharedHabits];
  }),

  createHabit: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
      daysOfWeek: z.array(z.number().min(0).max(6)),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const result = await db.insert(habits).values({
        userId: ctx.user.id,
        name: input.name,
        description: input.description ?? null,
        icon: input.icon ?? "🎯",
        color: input.color ?? "#6366f1",
        daysOfWeek: input.daysOfWeek,
      });
      return { id: Number(result[0].insertId) };
    }),

  deleteHabit: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      await db.delete(habitLogs).where(and(eq(habitLogs.habitId, input.id), eq(habitLogs.userId, ctx.user.id)));
      await db.delete(habits).where(and(eq(habits.id, input.id), eq(habits.userId, ctx.user.id)));
      return { success: true };
    }),

  toggleHabitLog: protectedProcedure
    .input(z.object({ habitId: z.number(), date: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [habit] = await db
        .select({ id: habits.id })
        .from(habits)
        .where(and(eq(habits.id, input.habitId), eq(habits.userId, ctx.user.id)))
        .limit(1);
      if (!habit) throw new TRPCError({ code: "NOT_FOUND", message: "Habit not found" });

      const existing = await db.select().from(habitLogs)
        .where(and(eq(habitLogs.habitId, input.habitId), eq(habitLogs.userId, ctx.user.id), eq(habitLogs.date, input.date)))
        .limit(1);
      if (existing.length > 0) {
        await db.update(habitLogs).set({ completed: !existing[0].completed }).where(eq(habitLogs.id, existing[0].id));
        return { completed: !existing[0].completed };
      } else {
        await db.insert(habitLogs).values({ habitId: input.habitId, userId: ctx.user.id, date: input.date, completed: true });
        return { completed: true };
      }
    }),

  getHabitLogs: protectedProcedure
    .input(z.object({ startDate: z.string(), endDate: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(habitLogs)
        .where(and(eq(habitLogs.userId, ctx.user.id), gte(habitLogs.date, input.startDate), lte(habitLogs.date, input.endDate)));
    }),

  // ─── Pomodoro ─────────────────────────────────────────────────────────────
  listPomodoros: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const limit = input?.limit ?? 20;
      return db.select().from(pomodoroSessions)
        .where(eq(pomodoroSessions.userId, ctx.user.id))
        .orderBy(desc(pomodoroSessions.createdAt))
        .limit(limit);
    }),

  savePomodoro: protectedProcedure
    .input(z.object({
      type: z.enum(["work", "short_break", "long_break"]),
      durationMinutes: z.number(),
      label: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const result = await db.insert(pomodoroSessions).values({
        userId: ctx.user.id,
        type: input.type,
        durationMinutes: input.durationMinutes,
        completedAt: new Date(),
        label: input.label ?? null,
      });
      return { id: Number(result[0].insertId) };
    }),

  pomodoroStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { todayCount: 0, todayMinutes: 0, weekCount: 0, weekMinutes: 0, totalCount: 0 };
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

    const allSessions = await db.select().from(pomodoroSessions)
      .where(and(eq(pomodoroSessions.userId, ctx.user.id), eq(pomodoroSessions.type, "work")));

    const todaySessions = allSessions.filter(s => s.completedAt && s.completedAt.toISOString().slice(0, 10) === today);
    const weekSessions = allSessions.filter(s => s.completedAt && s.completedAt.toISOString().slice(0, 10) >= weekAgo);

    return {
      todayCount: todaySessions.length,
      todayMinutes: todaySessions.reduce((a, s) => a + s.durationMinutes, 0),
      weekCount: weekSessions.length,
      weekMinutes: weekSessions.reduce((a, s) => a + s.durationMinutes, 0),
      totalCount: allSessions.length,
    };
  }),

  // ─── Daily Tasks ──────────────────────────────────────────────────────────
  listTasks: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      category: z.string().optional(),
      date: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(dailyTasks.userId, ctx.user.id)];
      if (input?.status && input.status !== "ALL") conditions.push(eq(dailyTasks.status, input.status));
      if (input?.category && input.category !== "ALL") conditions.push(eq(dailyTasks.category, input.category));
      if (input?.date) conditions.push(eq(dailyTasks.dueDate, input.date));
      const ownTasks = await db.select().from(dailyTasks).where(and(...conditions)).orderBy(desc(dailyTasks.createdAt));

      // Fetch spouse shared tasks
      const spouseLinks = await db.select().from(userLinks)
        .where(and(
          or(eq(userLinks.ownerId, ctx.user.id), eq(userLinks.linkedUserId, ctx.user.id)),
          eq(userLinks.type, "spouse"),
          eq(userLinks.status, "accepted"),
          eq(userLinks.shareProductivity, true),
        ));

      const sharedTasks: Array<typeof ownTasks[0] & { isShared: true; ownerName: string }> = [];
      for (const link of spouseLinks) {
        const otherUserId = link.ownerId === ctx.user.id ? link.linkedUserId : link.ownerId;
        const [otherUser] = await db.select({ name: users.name }).from(users).where(eq(users.id, otherUserId));
        const spouseConditions = [eq(dailyTasks.userId, otherUserId)];
        if (input?.status && input.status !== "ALL") spouseConditions.push(eq(dailyTasks.status, input.status));
        if (input?.date) spouseConditions.push(eq(dailyTasks.dueDate, input.date));
        const tasks = await db.select().from(dailyTasks).where(and(...spouseConditions)).orderBy(desc(dailyTasks.createdAt));
        for (const t of tasks) {
          sharedTasks.push({ ...t, isShared: true as const, ownerName: otherUser?.name ?? "Cônjuge" });
        }
      }

      return [
        ...ownTasks.map(t => ({ ...t, isShared: false as const, ownerName: "" })),
        ...sharedTasks,
      ];
    }),

  createTask: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      dueDate: z.string().optional(),
      dueTime: z.string().optional(),
      priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
      category: z.enum(["WORK", "PERSONAL", "OTHER"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const result = await db.insert(dailyTasks).values({
        userId: ctx.user.id,
        title: input.title,
        description: input.description ?? null,
        dueDate: input.dueDate ?? new Date().toISOString().slice(0, 10),
        dueTime: input.dueTime ?? null,
        priority: input.priority ?? "MEDIUM",
        category: input.category ?? "WORK",
      });
      return { id: Number(result[0].insertId) };
    }),

  updateTask: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      dueDate: z.string().optional(),
      dueTime: z.string().optional(),
      priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
      status: z.enum(["PENDING", "DONE", "ARCHIVED"]).optional(),
      category: z.enum(["WORK", "PERSONAL", "OTHER"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const { id, ...updates } = input;
      const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined));
      if (Object.keys(cleanUpdates).length > 0) {
        await db.update(dailyTasks).set(cleanUpdates).where(and(eq(dailyTasks.id, id), eq(dailyTasks.userId, ctx.user.id)));
      }
      return { success: true };
    }),

  deleteTask: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      await db.delete(dailyTasks).where(and(eq(dailyTasks.id, input.id), eq(dailyTasks.userId, ctx.user.id)));
      return { success: true };
    }),

  // ─── Daily Briefing ───────────────────────────────────────────────────────
  dailyBriefing: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { todayTasks: [], overdueTasks: [], todayHabits: [], yesterdayHabitStats: { done: 0, total: 0 }, pomodoroStats: { today: 0 }, pendingCampaigns: 0, unreadNotifications: 0 };

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const dayOfWeek = new Date().getDay();

    // Today's tasks
    const todayTasks = await db.select().from(dailyTasks)
      .where(and(eq(dailyTasks.userId, ctx.user.id), eq(dailyTasks.dueDate, today), eq(dailyTasks.status, "PENDING")));

    // Overdue tasks
    const overdueTasks = await db.select().from(dailyTasks)
      .where(and(eq(dailyTasks.userId, ctx.user.id), eq(dailyTasks.status, "PENDING")))
      .then(tasks => tasks.filter(t => t.dueDate && t.dueDate < today));

    // Today's habits
    const allHabits = await db.select().from(habits)
      .where(and(eq(habits.userId, ctx.user.id), eq(habits.active, true)));
    const todayHabits = allHabits.filter(h => {
      const days = h.daysOfWeek as number[] | null;
      return !days || days.length === 0 || days.includes(dayOfWeek);
    });

    // Yesterday habit stats
    const yesterdayLogs = await db.select().from(habitLogs)
      .where(and(eq(habitLogs.userId, ctx.user.id), eq(habitLogs.date, yesterday)));
    const yesterdayDone = yesterdayLogs.filter(l => l.completed).length;
    const yesterdayHabitsCount = allHabits.filter(h => {
      const days = h.daysOfWeek as number[] | null;
      const yDay = new Date(Date.now() - 86400000).getDay();
      return !days || days.length === 0 || days.includes(yDay);
    }).length;

    // Today's pomodoros
    const todayPomodoros = await db.select().from(pomodoroSessions)
      .where(and(eq(pomodoroSessions.userId, ctx.user.id), eq(pomodoroSessions.type, "work")))
      .then(sessions => sessions.filter(s => s.completedAt && s.completedAt.toISOString().slice(0, 10) === today));

    // Pending campaigns
    let pendingCampaigns = 0;
    try {
      const campaignRows = await db.select().from(campaigns)
        .where(and(eq(campaigns.status, "review"), eq(campaigns.userId, ctx.user.id)));
      pendingCampaigns = campaignRows.length;
    } catch { /* ignore */ }

    // Unread notifications
    let unreadNotifications = 0;
    try {
      const notifRows = await db.select().from(notifications)
        .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.read, false)));
      unreadNotifications = notifRows.length;
    } catch { /* ignore */ }

    return {
      todayTasks,
      overdueTasks,
      todayHabits,
      yesterdayHabitStats: { done: yesterdayDone, total: yesterdayHabitsCount },
      pomodoroStats: { today: todayPomodoros.length },
      pendingCampaigns,
      unreadNotifications,
    };
  }),

  // ─── Morning Briefing (popup data for first open of the day) ──────────────
  morningBriefing: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { missedHabits: [], overdueTasks: [], hasData: false };

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const yesterdayDow = new Date(Date.now() - 86400000).getDay();

    // Yesterday's missed habits
    const allHabits = await db.select().from(habits).where(eq(habits.userId, ctx.user.id));
    const yesterdayHabits = allHabits.filter(h => {
      const days = h.daysOfWeek as number[] | null;
      return !days || days.length === 0 || days.includes(yesterdayDow);
    });
    const yesterdayLogs = await db.select().from(habitLogs)
      .where(and(eq(habitLogs.userId, ctx.user.id), eq(habitLogs.date, yesterday)));
    const missedHabits = yesterdayHabits.filter(h =>
      !yesterdayLogs.some(l => l.habitId === h.id && l.completed)
    ).map(h => ({ id: h.id, name: h.name, icon: h.icon ?? "🎯" }));

    // Overdue pending tasks (will be postponed to today)
    const allPending = await db.select().from(dailyTasks)
      .where(and(eq(dailyTasks.userId, ctx.user.id), eq(dailyTasks.status, "PENDING")));
    const overdueTasks = allPending
      .filter(t => t.dueDate && t.dueDate < today)
      .map(t => ({ id: t.id, title: t.title, dueDate: t.dueDate, priority: t.priority }));

    // Client payments due today
    const duePayments = await db.select().from(clientPaymentRecords)
      .where(and(
        eq(clientPaymentRecords.userId, ctx.user.id),
        eq(clientPaymentRecords.dueDate, today),
        eq(clientPaymentRecords.status, "pending"),
      ));
    const allClients = duePayments.length > 0
      ? await db.select({ id: clients.id, name: clients.name }).from(clients).where(eq(clients.userId, ctx.user.id))
      : [];
    const clientMap = new Map(allClients.map(c => [c.id, c.name]));
    const duePaymentsEnriched = duePayments.map(p => ({
      id: p.id,
      clientId: p.clientId,
      clientName: clientMap.get(p.clientId) ?? "Cliente",
      amount: p.amount,
      dueDate: p.dueDate,
    }));

    return {
      missedHabits,
      overdueTasks,
      duePayments: duePaymentsEnriched,
      hasData: missedHabits.length > 0 || overdueTasks.length > 0 || duePaymentsEnriched.length > 0,
    };
  }),

  // ─── Postpone all overdue tasks to today ──────────────────────────────────
  postponeOverdueTasks: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { count: 0 };

    const today = new Date().toISOString().slice(0, 10);
    const allPending = await db.select().from(dailyTasks)
      .where(and(eq(dailyTasks.userId, ctx.user.id), eq(dailyTasks.status, "PENDING")));
    const overdue = allPending.filter(t => t.dueDate && t.dueDate < today);

    for (const task of overdue) {
      await db.update(dailyTasks).set({ dueDate: today })
        .where(eq(dailyTasks.id, task.id));
    }

    return { count: overdue.length };
  }),
});
