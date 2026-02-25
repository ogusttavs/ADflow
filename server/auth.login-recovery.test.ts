import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UNVERIFIED_ACCOUNT_MAX_AGE_MS } from "@shared/const";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const dbMock = vi.hoisted(() => ({
  getDb: vi.fn(),
  getUserByEmail: vi.fn(),
  createAuthToken: vi.fn(),
  deleteUserAndAuthTokensById: vi.fn(),
  getUsersByTaxIdTail: vi.fn(),
}));

const emailMock = vi.hoisted(() => ({
  sendTransactionalEmail: vi.fn(),
}));

const authTokenMock = vi.hoisted(() => ({
  createRawAuthToken: vi.fn().mockReturnValue("verify_token_value_1234567890"),
  hashAuthToken: vi.fn((token: string) => `hash_${token}`),
}));

const profileCryptoMock = vi.hoisted(() => ({
  decryptProfileSensitiveValue: vi.fn(),
  encryptProfileSensitiveValue: vi.fn((value: string) => `encrypted_${value}`),
}));

vi.mock("./db", () => dbMock);
vi.mock("./_core/email", () => emailMock);
vi.mock("./_core/authToken", () => authTokenMock);
vi.mock("./_core/profileCrypto", () => profileCryptoMock);

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      get: (headerName: string) => {
        if (headerName.toLowerCase() === "host") return "getorbita.com.br";
        return undefined;
      },
    } as TrpcContext["req"],
    res: {
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("auth.login verification rules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getDb.mockResolvedValue({});
  });

  it("blocks login for unverified account inside grace period", async () => {
    const passwordHash = await bcrypt.hash("Old-password@123", 10);
    dbMock.getUserByEmail.mockResolvedValue({
      id: 9,
      openId: "local_9",
      name: "Conta Pendente",
      email: "pending@orbita.app",
      passwordHash,
      emailVerified: false,
      createdAt: new Date(),
      role: "user",
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      loginMethod: "email",
    });

    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.auth.login({
        email: "pending@orbita.app",
        password: "Old-password@123",
      }),
    ).rejects.toThrow("Confirme seu email para entrar. Reenvie o link de verificação.");

    expect(dbMock.deleteUserAndAuthTokensById).not.toHaveBeenCalled();
  });

  it("deletes expired unverified account on login attempt", async () => {
    const passwordHash = await bcrypt.hash("Old-password@123", 10);
    dbMock.getUserByEmail.mockResolvedValue({
      id: 10,
      openId: "local_10",
      name: "Conta Expirada",
      email: "expired@orbita.app",
      passwordHash,
      emailVerified: false,
      createdAt: new Date(Date.now() - UNVERIFIED_ACCOUNT_MAX_AGE_MS - 1000),
      role: "user",
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      loginMethod: "email",
    });
    dbMock.deleteUserAndAuthTokensById.mockResolvedValue(true);

    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.auth.login({
        email: "expired@orbita.app",
        password: "Old-password@123",
      }),
    ).rejects.toThrow("Sua conta expirou por falta de verificação de email. Faça um novo cadastro.");

    expect(dbMock.deleteUserAndAuthTokensById).toHaveBeenCalledWith(10);
  });
});

describe("auth.requestEmailVerification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getDb.mockResolvedValue({});
  });

  it("returns generic success and sends email when account is pending", async () => {
    dbMock.getUserByEmail.mockResolvedValue({
      id: 5,
      openId: "local_5",
      name: "Usuário Teste",
      email: "user@orbita.app",
      emailVerified: false,
      createdAt: new Date(),
      role: "user",
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });
    dbMock.createAuthToken.mockResolvedValue(77);

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.requestEmailVerification({
      email: "user@orbita.app",
    });

    expect(result).toEqual({ success: true });
    expect(dbMock.createAuthToken).toHaveBeenCalledTimes(1);
    expect(emailMock.sendTransactionalEmail).toHaveBeenCalledTimes(1);
  });
});

describe("auth.recoverEmailByTaxId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getDb.mockResolvedValue({});
  });

  it("returns account email when CPF/CNPJ matches", async () => {
    dbMock.getUsersByTaxIdTail.mockResolvedValue([
      {
        id: 7,
        openId: "local_7",
        name: "Usuário Teste",
        email: "user@orbita.app",
        taxIdType: "cpf",
        taxIdLast4: "4725",
        taxIdEncrypted: "profile_v1:iv:tag:enc",
        emailVerified: true,
        createdAt: new Date(),
        role: "user",
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
    ]);
    profileCryptoMock.decryptProfileSensitiveValue.mockReturnValue("52998224725");

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.recoverEmailByTaxId({
      taxId: "529.982.247-25",
    });

    expect(result).toEqual({
      success: true,
      email: "user@orbita.app",
    });
  });
});
