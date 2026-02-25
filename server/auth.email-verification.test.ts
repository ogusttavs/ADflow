import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const dbMock = vi.hoisted(() => ({
  getDb: vi.fn(),
  getActiveAuthTokenByHash: vi.fn(),
  getUserById: vi.fn(),
  updateUserById: vi.fn(),
  markAuthTokenUsed: vi.fn(),
  getUserByOpenId: vi.fn(),
  createAuthToken: vi.fn(),
}));

const emailMock = vi.hoisted(() => ({
  sendTransactionalEmail: vi.fn(),
}));

const authTokenMock = vi.hoisted(() => ({
  createRawAuthToken: vi.fn().mockReturnValue("verify_token_value_1234567890"),
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

function createAuthContext(): TrpcContext {
  return {
    user: {
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

describe("auth.verifyEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getDb.mockResolvedValue({});
  });

  it("verifies user email and marks token as used", async () => {
    dbMock.getActiveAuthTokenByHash.mockResolvedValue({
      id: 21,
      userId: 7,
      type: "email_verification",
      tokenHash: "hash_verify_token_value_1234567890",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      usedAt: null,
      createdAt: new Date(),
    });
    dbMock.getUserById.mockResolvedValue({
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
    dbMock.updateUserById.mockResolvedValue(undefined);
    dbMock.markAuthTokenUsed.mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.verifyEmail({
      token: "verify_token_value_1234567890",
    });

    expect(result).toEqual({ success: true });
    expect(dbMock.updateUserById).toHaveBeenCalledTimes(1);
    expect(dbMock.markAuthTokenUsed).toHaveBeenCalledWith(21);
  });

  it("rejects invalid or expired verification token", async () => {
    dbMock.getActiveAuthTokenByHash.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createPublicContext());

    await expect(
      caller.auth.verifyEmail({
        token: "verify_token_value_1234567890",
      }),
    ).rejects.toThrow("Link de verificação inválido ou expirado.");
  });
});

describe("auth.resendVerification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getDb.mockResolvedValue({});
  });

  it("creates a verification token and sends email for unverified user", async () => {
    dbMock.getUserByOpenId.mockResolvedValue({
      id: 7,
      openId: "local_7",
      name: "Usuário Teste",
      email: "user@orbita.app",
      passwordHash: "hashed-password",
      loginMethod: "email",
      role: "user",
      emailVerified: false,
      emailVerifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });
    dbMock.createAuthToken.mockResolvedValue(33);

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.auth.resendVerification();

    expect(result).toEqual({ success: true, alreadyVerified: false });
    expect(dbMock.createAuthToken).toHaveBeenCalledTimes(1);
    expect(emailMock.sendTransactionalEmail).toHaveBeenCalledTimes(1);
    const emailArgs = emailMock.sendTransactionalEmail.mock.calls[0]?.[0];
    expect(emailArgs.to).toBe("user@orbita.app");
    expect(emailArgs.html).toContain("/verify-email?token=verify_token_value_1234567890");
  });

  it("returns alreadyVerified without sending email", async () => {
    dbMock.getUserByOpenId.mockResolvedValue({
      id: 7,
      openId: "local_7",
      name: "Usuário Teste",
      email: "user@orbita.app",
      passwordHash: "hashed-password",
      loginMethod: "email",
      role: "user",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.auth.resendVerification();

    expect(result).toEqual({ success: true, alreadyVerified: true });
    expect(dbMock.createAuthToken).not.toHaveBeenCalled();
    expect(emailMock.sendTransactionalEmail).not.toHaveBeenCalled();
  });
});
