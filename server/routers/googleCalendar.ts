import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { dailyTasks, googleCalendarConnections } from "../../drizzle/schema";
import { getSessionCookieOptions } from "../_core/cookies";
import {
  GOOGLE_CALENDAR_OAUTH_STATE_COOKIE,
  buildGoogleCalendarAuthUrl,
  ensureGoogleCalendarAccess,
  getGoogleCalendarConnection,
  googleCalendarApiRequest,
  removeGoogleCalendarConnection,
} from "../_core/googleCalendar";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

type GoogleEventDateTime = {
  date?: string;
  dateTime?: string;
  timeZone?: string;
};

type GoogleEvent = {
  id?: string;
  status?: string;
  summary?: string;
  htmlLink?: string;
  start?: GoogleEventDateTime;
  end?: GoogleEventDateTime;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function buildTimedEnd(date: string, time: string, durationMinutes: number) {
  const [hour, minute] = time.split(":").map(v => Number(v));
  const total = hour * 60 + minute + durationMinutes;
  const dayOffset = Math.floor(total / (24 * 60));
  const minutesInDay = total % (24 * 60);
  const endHour = Math.floor(minutesInDay / 60);
  const endMinute = minutesInDay % 60;
  const endDate = addDays(date, dayOffset);
  return `${endDate}T${pad(endHour)}:${pad(endMinute)}:00`;
}

export const googleCalendarRouter = router({
  connectionStatus: protectedProcedure.query(async ({ ctx }) => {
    const configured = Boolean(ENV.googleClientId && ENV.googleClientSecret);
    if (!configured) {
      return {
        configured: false,
        connected: false,
        email: null as string | null,
        expiresAt: null as string | null,
      };
    }

    const connection = await getGoogleCalendarConnection(ctx.user.id);
    if (!connection) {
      return {
        configured: true,
        connected: false,
        email: null as string | null,
        expiresAt: null as string | null,
      };
    }

    return {
      configured: true,
      connected: true,
      email: connection.googleEmail ?? null,
      expiresAt: connection.expiryDate ? connection.expiryDate.toISOString() : null,
      calendarId: connection.calendarId,
    };
  }),

  getAuthUrl: protectedProcedure.mutation(({ ctx }) => {
    if (!ENV.googleClientId || !ENV.googleClientSecret) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Google OAuth não configurado no servidor",
      });
    }

    const state = randomBytes(24).toString("hex");
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.cookie(GOOGLE_CALENDAR_OAUTH_STATE_COOKIE, state, {
      ...cookieOptions,
      maxAge: 10 * 60 * 1000, // 10 minutes
    });

    return { url: buildGoogleCalendarAuthUrl(ctx.req, state) };
  }),

  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    await removeGoogleCalendarConnection(ctx.user.id);
    return { success: true };
  }),

  listUpcomingEvents: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).optional(),
      days: z.number().min(1).max(365).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const connection = await getGoogleCalendarConnection(ctx.user.id);
      if (!connection) return [];

      try {
        const { accessToken } = await ensureGoogleCalendarAccess(ctx.user.id);
        const limit = input?.limit ?? 8;
        const days = input?.days ?? 30;
        const timeMin = new Date().toISOString();
        const timeMax = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

        const params = new URLSearchParams({
          singleEvents: "true",
          orderBy: "startTime",
          maxResults: String(limit),
          timeMin,
          timeMax,
        });

        const calendarId = encodeURIComponent(connection.calendarId || "primary");
        const data = await googleCalendarApiRequest<{ items?: GoogleEvent[] }>(
          accessToken,
          `/calendars/${calendarId}/events?${params.toString()}`,
        );

        return (data.items ?? []).map(item => {
          const start = item.start?.dateTime ?? item.start?.date ?? null;
          const end = item.end?.dateTime ?? item.end?.date ?? null;
          return {
            id: item.id ?? "",
            summary: item.summary ?? "(Sem título)",
            status: item.status ?? "confirmed",
            start,
            end,
            isAllDay: Boolean(item.start?.date && !item.start?.dateTime),
            htmlLink: item.htmlLink ?? null,
          };
        });
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Falha ao listar eventos do Google Agenda",
        });
      }
    }),

  syncTasksForDate: protectedProcedure
    .input(z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      timeZone: z.string().optional(),
      durationMinutes: z.number().min(10).max(240).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });

      const connection = await getGoogleCalendarConnection(ctx.user.id);
      if (!connection) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Conecte o Google Agenda antes de sincronizar." });
      }

      let accessToken: string;
      try {
        accessToken = (await ensureGoogleCalendarAccess(ctx.user.id)).accessToken;
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Falha ao validar conexão Google",
        });
      }

      const tasks = await db
        .select()
        .from(dailyTasks)
        .where(and(
          eq(dailyTasks.userId, ctx.user.id),
          eq(dailyTasks.dueDate, input.date),
        ));

      const eligibleTasks = tasks.filter(task => task.status !== "ARCHIVED");
      if (eligibleTasks.length === 0) {
        return { created: 0, skipped: 0 };
      }

      const timeZone = input.timeZone ?? "America/Sao_Paulo";
      const duration = input.durationMinutes ?? 30;
      let created = 0;
      let skipped = 0;

      for (const task of eligibleTasks) {
        try {
          const title = `[Orbita] ${task.title}`;
          const descriptionParts = [
            task.description ? `Descrição: ${task.description}` : "",
            `Categoria: ${task.category}`,
            `Prioridade: ${task.priority}`,
            `Status: ${task.status}`,
          ].filter(Boolean);

          const hasTime = Boolean(task.dueTime && /^\d{2}:\d{2}$/.test(task.dueTime));
          const payload = hasTime
            ? {
                summary: title,
                description: descriptionParts.join("\n"),
                start: {
                  dateTime: `${input.date}T${task.dueTime}:00`,
                  timeZone,
                },
                end: {
                  dateTime: buildTimedEnd(input.date, task.dueTime!, duration),
                  timeZone,
                },
              }
            : {
                summary: title,
                description: descriptionParts.join("\n"),
                start: { date: input.date },
                end: { date: addDays(input.date, 1) },
              };

          const calendarId = encodeURIComponent(connection.calendarId || "primary");
          await googleCalendarApiRequest(
            accessToken,
            `/calendars/${calendarId}/events`,
            {
              method: "POST",
              body: JSON.stringify(payload),
            },
          );
          created++;
        } catch {
          skipped++;
        }
      }

      await db.update(googleCalendarConnections)
        .set({ lastSyncAt: new Date() })
        .where(eq(googleCalendarConnections.userId, ctx.user.id));

      return { created, skipped };
    }),
});
