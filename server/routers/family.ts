import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { getUserByEmail } from "../db";
import { userLinks, users, notifications } from "../../drizzle/schema";
import { eq, and, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const familyRouter = router({
  // Get all links where the current user is owner or linkedUser
  listLinks: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const links = await db.select().from(userLinks)
      .where(or(
        eq(userLinks.ownerId, ctx.user.id),
        eq(userLinks.linkedUserId, ctx.user.id),
      ));

    // Enrich with names from users table
    const enriched = await Promise.all(links.map(async (link) => {
      const [owner] = await db.select({ id: users.id, name: users.name, email: users.email })
        .from(users).where(eq(users.id, link.ownerId));
      const [linked] = await db.select({ id: users.id, name: users.name, email: users.email })
        .from(users).where(eq(users.id, link.linkedUserId));
      return { ...link, owner, linked };
    }));

    return enriched;
  }),

  sendInvite: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      type: z.enum(["spouse", "employee"]),
      sharePersonTypes: z.array(z.enum(["cpf", "cnpj"])).min(1),
      permission: z.enum(["view", "edit"]).default("view"),
      shareProductivity: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Cannot invite yourself
      if (input.email === ctx.user.email) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode se convidar." });
      }

      // Find the target user
      const target = await getUserByEmail(input.email);
      if (!target) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado. Peça para que ele se cadastre primeiro.",
        });
      }

      // Check for duplicate
      const [existing] = await db.select({ id: userLinks.id })
        .from(userLinks)
        .where(and(
          eq(userLinks.ownerId, ctx.user.id),
          eq(userLinks.linkedUserId, target.id),
        ));
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Já existe um convite para este usuário." });
      }

      // Create the link
      await db.insert(userLinks).values({
        ownerId: ctx.user.id,
        linkedUserId: target.id,
        type: input.type,
        sharePersonTypes: input.sharePersonTypes,
        permission: input.permission,
        shareProductivity: input.type === "spouse" ? input.shareProductivity : false,
        status: "pending",
        invitedEmail: input.email,
      });

      // Notify the invited user
      const typeLabel = input.type === "spouse" ? "cônjuge" : "funcionário";
      await db.insert(notifications).values({
        userId: target.id,
        type: "invite",
        title: "Convite de compartilhamento",
        message: `${ctx.user.name || ctx.user.email} quer te adicionar como ${typeLabel} e compartilhar finanças com você.`,
        relatedType: "userLink",
      });

      return { success: true };
    }),

  acceptInvite: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(userLinks)
        .set({ status: "accepted" })
        .where(and(eq(userLinks.id, input.id), eq(userLinks.linkedUserId, ctx.user.id)));
      return { success: true };
    }),

  rejectInvite: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(userLinks)
        .set({ status: "rejected" })
        .where(and(eq(userLinks.id, input.id), eq(userLinks.linkedUserId, ctx.user.id)));
      return { success: true };
    }),

  removeLink: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Allow either owner or linkedUser to remove/leave
      await db.delete(userLinks)
        .where(and(
          eq(userLinks.id, input.id),
          or(eq(userLinks.ownerId, ctx.user.id), eq(userLinks.linkedUserId, ctx.user.id)),
        ));
      return { success: true };
    }),

  updateLink: protectedProcedure
    .input(z.object({
      id: z.number(),
      sharePersonTypes: z.array(z.enum(["cpf", "cnpj"])).min(1).optional(),
      permission: z.enum(["view", "edit"]).optional(),
      shareProductivity: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...data } = input;
      await db.update(userLinks).set(data)
        .where(and(eq(userLinks.id, id), eq(userLinks.ownerId, ctx.user.id)));
      return { success: true };
    }),
});
