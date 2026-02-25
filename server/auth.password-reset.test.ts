import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const dbMock = vi.hoisted(() => ({
  getDb: vi.fn(),
  getUserByEmail: vi.fn(),
  createAuthToken: vi.fn(),
  getActiveAuthTokenByHash: vi.fn(),
  getUserById: vi.fn(),
  updateUserById: vi.fn(),
  markAuthTokenUsed: vi.fn(),
}));

const emailMock = vi.hoisted(() => ({
  sendTransactionalEmail: vi.fn(),
}));

const RAW_RESET_TOKEN = "raw_reset_token_value_1234567890";

const authTokenMock = vi.hoisted(() => ({
  createRawAuthToken: vi.fn().mockReturnValue("raw_reset_token_value_1234567890"),
  hashAuthToken: vi.fn((token: string) => `hash_${token}`),
}));

vi.mock("./db", () => dbMock);
vi.mock("./_core/email", () => emailMock);
vi.mock("./_core/authToken", () => authTokenMock);

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
    res: {} as TrpcContext["res"],
  };
}

describe("auth.requestPasswordReset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getDb.mockResolvedValue({});
  });

  it("returns generic success when user does not exist", async () => {
    dbMock.getUserByEmail.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.auth.requestPasswordReset({
      email: "missing@orbita.app",
    });

    expect(result).toEqual({ success: true });
    expect(dbMock.createAuthToken).not.toHaveBeenCalled();
    expect(emailMock.sendTransactionalEmail).not.toHaveBeenCalled();
  });

  it("creates token and sends email when account exists", async () => {
    dbMock.getUserByEmail.mockResolvedValue({
      id: 7,
      openId: "local_7",
      name: "Usuário Teste",
      email: "user@orbita.app",
      passwordHash: "hashed-password",
      loginMethod: "email",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.requestPasswordReset({
      email: "user@orbita.app",
    });

    expect(result).toEqual({ success: true });
    expect(dbMock.createAuthToken).toHaveBeenCalledTimes(1);
    expect(emailMock.sendTransactionalEmail).toHaveBeenCalledTimes(1);

    const emailArgs = emailMock.sendTransactionalEmail.mock.calls[0]?.[0];
    expect(emailArgs.to).toBe("user@orbita.app");
    expect(emailArgs.html).toContain(`/reset-password?token=${RAW_RESET_TOKEN}`);
  });
});

describe("auth.resetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getDb.mockResolvedValue({});
  });

  it("updates password and marks token as used", async () => {
    const oldPasswordHash = await bcrypt.hash("old-password", 10);
    dbMock.getActiveAuthTokenByHash.mockResolvedValue({
      id: 99,
      userId: 7,
      type: "password_reset",
      tokenHash: `hash_${RAW_RESET_TOKEN}`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      usedAt: null,
      createdAt: new Date(),
    });
    dbMock.getUserById.mockResolvedValue({
      id: 7,
      openId: "local_7",
      name: "Usuário Teste",
      email: "user@orbita.app",
      passwordHash: oldPasswordHash,
      loginMethod: "email",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });
    dbMock.updateUserById.mockResolvedValue(undefined);
    dbMock.markAuthTokenUsed.mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.resetPassword({
      token: RAW_RESET_TOKEN,
      newPassword: "New-password@123",
    });

    expect(result).toEqual({ success: true });
    expect(dbMock.updateUserById).toHaveBeenCalledTimes(1);
    expect(dbMock.markAuthTokenUsed).toHaveBeenCalledWith(99);
  });

  it("rejects invalid or expired token", async () => {
    dbMock.getActiveAuthTokenByHash.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createPublicContext());

    await expect(
      caller.auth.resetPassword({
        token: "invalid_token_value_123456789",
        newPassword: "New-password@123",
      }),
    ).rejects.toThrow("Link de recuperação inválido ou expirado.");
  });

  it("rejects weak password", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(
      caller.auth.resetPassword({
        token: RAW_RESET_TOKEN,
        newPassword: "fraca123",
      }),
    ).rejects.toThrow("A senha precisa de pelo menos uma letra maiúscula.");
  });
});
