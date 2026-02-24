import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { clientIntakeForms, clients } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

const fieldSchema = z.object({
  id: z.string(),
  type: z.enum(["text", "textarea", "select", "email", "phone", "url"]),
  label: z.string(),
  placeholder: z.string().optional(),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
});

export const intakeRouter = router({
  // Protected: get or initialize the form for a client
  getForm: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const [client] = await db.select({ id: clients.id, name: clients.name }).from(clients)
        .where(and(eq(clients.id, input.clientId), eq(clients.userId, ctx.user.id)));
      if (!client) return null;
      const [form] = await db.select().from(clientIntakeForms)
        .where(and(eq(clientIntakeForms.clientId, input.clientId), eq(clientIntakeForms.userId, ctx.user.id)));
      return form ?? null;
    }),

  saveForm: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      fields: z.array(fieldSchema),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [existing] = await db.select({ id: clientIntakeForms.id }).from(clientIntakeForms)
        .where(and(eq(clientIntakeForms.clientId, input.clientId), eq(clientIntakeForms.userId, ctx.user.id)));
      if (existing) {
        await db.update(clientIntakeForms)
          .set({ title: input.title, description: input.description ?? null, fields: input.fields })
          .where(eq(clientIntakeForms.id, existing.id));
      } else {
        const token = nanoid(32);
        await db.insert(clientIntakeForms).values({
          userId: ctx.user.id,
          clientId: input.clientId,
          token,
          title: input.title,
          description: input.description ?? null,
          fields: input.fields,
        });
      }
      return { success: true };
    }),

  generateToken: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const token = nanoid(32);
      const [existing] = await db.select({ id: clientIntakeForms.id }).from(clientIntakeForms)
        .where(and(eq(clientIntakeForms.clientId, input.clientId), eq(clientIntakeForms.userId, ctx.user.id)));
      if (existing) {
        await db.update(clientIntakeForms).set({ token }).where(eq(clientIntakeForms.id, existing.id));
      } else {
        await db.insert(clientIntakeForms).values({
          userId: ctx.user.id,
          clientId: input.clientId,
          token,
          title: "Formulário de Onboarding",
          fields: [],
        });
      }
      return { token };
    }),

  // Public: fetch form by token (no auth)
  getPublicForm: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [form] = await db.select({
        id: clientIntakeForms.id,
        title: clientIntakeForms.title,
        description: clientIntakeForms.description,
        fields: clientIntakeForms.fields,
        submittedAt: clientIntakeForms.submittedAt,
      }).from(clientIntakeForms).where(eq(clientIntakeForms.token, input.token));
      return form ?? null;
    }),

  // Public: submit responses
  submitForm: publicProcedure
    .input(z.object({
      token: z.string(),
      responses: z.record(z.string(), z.string()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [form] = await db.select({ id: clientIntakeForms.id, submittedAt: clientIntakeForms.submittedAt })
        .from(clientIntakeForms).where(eq(clientIntakeForms.token, input.token));
      if (!form) throw new TRPCError({ code: "NOT_FOUND", message: "Formulário não encontrado" });
      await db.update(clientIntakeForms)
        .set({ responses: input.responses as Record<string, string>, submittedAt: new Date() })
        .where(eq(clientIntakeForms.id, form.id));
      return { success: true };
    }),
});
