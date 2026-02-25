import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("auth.me", () => {
  it("returns null when not authenticated", async () => {
    const caller = appRouter.createCaller(createContext(null));
    const result = await caller.auth.me();

    expect(result).toBeNull();
  });

  it("returns only public profile fields", async () => {
    const caller = appRouter.createCaller(
      createContext({
        id: 11,
        openId: "local_11",
        role: "user",
        loginMethod: "email",
        name: "Ana Silva",
        firstName: "Ana",
        lastName: "Silva",
        email: "ana@orbita.app",
        whatsapp: "+5511999999999",
        city: "São Paulo",
        address: "Rua A, 123",
        acquisitionSource: "Instagram",
        preferredLanguage: "Português (Brasil)",
        marketingOptIn: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        taxIdType: "cpf",
        taxIdEncrypted: "profile_v1:xxx:yyy:zzz",
        taxIdLast4: "1234",
        passwordHash: "bcrypt_hash",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      }),
    );

    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result).not.toHaveProperty("passwordHash");
    expect(result).not.toHaveProperty("taxIdEncrypted");
    expect(result).toMatchObject({
      id: 11,
      email: "ana@orbita.app",
      taxIdMasked: "***.***.***-1234",
    });
  });
});

