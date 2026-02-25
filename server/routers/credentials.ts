import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { clientCredentials, clients } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  decryptCredentialOrLegacy,
  encryptCredentialValue,
} from "../_core/credentialsCrypto";

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
      const credentials = await db.select().from(clientCredentials)
        .where(and(eq(clientCredentials.clientId, input.clientId), eq(clientCredentials.userId, ctx.user.id)));

      return credentials.map(credential => {
        if (!credential.password) return credential;

        try {
          return {
            ...credential,
            password: decryptCredentialOrLegacy(credential.password),
          };
        } catch (error) {
          console.error("[Credentials] Failed to decrypt credential password", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao descriptografar credenciais. Verifique a configuração da chave.",
          });
        }
      });
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
      let encryptedPassword = input.password;
      if (input.password) {
        try {
          encryptedPassword = encryptCredentialValue(input.password);
        } catch (error) {
          console.error("[Credentials] Failed to encrypt credential password", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao criptografar credenciais. Verifique CREDENTIAL_ENCRYPTION_KEY.",
          });
        }
      }

      await db.insert(clientCredentials).values({
        ...input,
        password: encryptedPassword,
        userId: ctx.user.id,
      });
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

      let encryptedPassword = data.password;
      if (typeof data.password === "string" && data.password.length > 0) {
        try {
          encryptedPassword = encryptCredentialValue(data.password);
        } catch (error) {
          console.error("[Credentials] Failed to encrypt credential password", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao criptografar credenciais. Verifique CREDENTIAL_ENCRYPTION_KEY.",
          });
        }
      }

      await db.update(clientCredentials).set({
        ...data,
        password: encryptedPassword,
      })
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
