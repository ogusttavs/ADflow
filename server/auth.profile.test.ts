import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const dbMock = vi.hoisted(() => ({
  getDb: vi.fn(),
  getUserByOpenId: vi.fn(),
  getUserByEmail: vi.fn(),
  updateUserById: vi.fn(),
  createAuthToken: vi.fn(),
}));

const emailMock = vi.hoisted(() => ({
  sendTransactionalEmail: vi.fn(),
}));

const authTokenMock = vi.hoisted(() => ({
  createRawAuthToken: vi.fn().mockReturnValue("verify_token_value_1234567890"),
  hashAuthToken: vi.fn((token: string) => `hash_${token}`),
}));

const profileCryptoMock = vi.hoisted(() => ({
  encryptProfileSensitiveValue: vi.fn((value: string) => `encrypted_${value}`),
}));

vi.mock("./db", () => dbMock);
vi.mock("./_core/email", () => emailMock);
vi.mock("./_core/authToken", () => authTokenMock);
vi.mock("./_core/profileCrypto", () => profileCryptoMock);

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 7,
      openId: "local_7",
      name: "Usuário Teste",
      firstName: "Usuário",
      lastName: "Teste",
      email: "user@orbita.app",
      whatsapp: "+5511999999999",
      city: "São Paulo",
      address: "Rua Teste, 123",
      acquisitionSource: "Instagram",
      preferredLanguage: "Português (Brasil)",
      marketingOptIn: false,
      taxIdType: "cpf",
      taxIdEncrypted: "encrypted_12345678901",
      taxIdLast4: "8901",
      passwordHash: "hashed-password",
      loginMethod: "email",
      role: "user",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      get: (headerName: string) => {
        if (headerName.toLowerCase() === "host") return "getorbita.com.br";
        return undefined;
      },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("auth.updateProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getDb.mockResolvedValue({});
  });

  it("updates user profile and keeps verification when email is unchanged", async () => {
    const ctx = createAuthContext();
    dbMock.getUserByOpenId.mockResolvedValue(ctx.user);
    dbMock.updateUserById.mockResolvedValue({
      ...ctx.user,
      city: "Campinas",
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.updateProfile({
      firstName: "Usuário",
      lastName: "Teste",
      email: "user@orbita.app",
      whatsapp: "+5511999999999",
      city: "Campinas",
      address: "Rua Atualizada, 987",
      acquisitionSource: "Indicação",
      preferredLanguage: "Português (Brasil)",
      marketingOptIn: true,
      taxId: "",
    });

    expect(result).toEqual({
      success: true,
      emailVerificationRequired: false,
    });
    expect(dbMock.updateUserById).toHaveBeenCalledTimes(1);
    expect(dbMock.getUserByEmail).not.toHaveBeenCalled();
    expect(dbMock.createAuthToken).not.toHaveBeenCalled();
    expect(emailMock.sendTransactionalEmail).not.toHaveBeenCalled();
  });

  it("requires new verification when email changes", async () => {
    const ctx = createAuthContext();
    dbMock.getUserByOpenId.mockResolvedValue(ctx.user);
    dbMock.getUserByEmail.mockResolvedValue(undefined);
    dbMock.updateUserById.mockResolvedValue(undefined);
    dbMock.createAuthToken.mockResolvedValue(11);

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.updateProfile({
      firstName: "Usuário",
      lastName: "Teste",
      email: "novo@orbita.app",
      whatsapp: "+5511999999999",
      city: "São Paulo",
      address: "Rua Teste, 123",
      acquisitionSource: "Instagram",
      preferredLanguage: "Português (Brasil)",
      marketingOptIn: false,
      taxId: "529.982.247-25",
    });

    expect(result).toEqual({
      success: true,
      emailVerificationRequired: true,
    });
    expect(profileCryptoMock.encryptProfileSensitiveValue).toHaveBeenCalledWith("52998224725");
    expect(dbMock.updateUserById).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        email: "novo@orbita.app",
        emailVerified: false,
        emailVerifiedAt: null,
        taxIdType: "cpf",
        taxIdLast4: "4725",
      }),
    );
    expect(dbMock.createAuthToken).toHaveBeenCalledTimes(1);
    expect(emailMock.sendTransactionalEmail).toHaveBeenCalledTimes(1);
  });
});
