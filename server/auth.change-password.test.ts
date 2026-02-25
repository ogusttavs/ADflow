import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const dbMock = vi.hoisted(() => ({
  getDb: vi.fn(),
  getUserByOpenId: vi.fn(),
  updateUserById: vi.fn(),
}));

vi.mock("./db", () => dbMock);

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "local_test_user",
    email: "test@orbita.app",
    name: "Test User",
    emailVerified: true,
    emailVerifiedAt: new Date(),
    loginMethod: "email",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("auth.changePassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("changes password when current password is valid", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const oldHash = await bcrypt.hash("old-password", 10);

    dbMock.getDb.mockResolvedValue({});
    dbMock.getUserByOpenId.mockResolvedValue({
      ...ctx.user,
      passwordHash: oldHash,
    });
    dbMock.updateUserById.mockResolvedValue({
      ...ctx.user,
      passwordHash: oldHash,
    });

    const result = await caller.auth.changePassword({
      currentPassword: "old-password",
      newPassword: "new-password-123",
    });

    expect(result).toEqual({ success: true });
    expect(dbMock.updateUserById).toHaveBeenCalledTimes(1);

    const [, updates] = dbMock.updateUserById.mock.calls[0] as [
      number,
      { passwordHash: string },
    ];

    expect(await bcrypt.compare("new-password-123", updates.passwordHash)).toBe(true);
  });

  it("rejects when current password is invalid", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const oldHash = await bcrypt.hash("old-password", 10);

    dbMock.getDb.mockResolvedValue({});
    dbMock.getUserByOpenId.mockResolvedValue({
      ...ctx.user,
      passwordHash: oldHash,
    });

    await expect(
      caller.auth.changePassword({
        currentPassword: "wrong-password",
        newPassword: "new-password-123",
      })
    ).rejects.toMatchObject<Partial<TRPCError>>({
      message: "Senha atual incorreta",
    });

    expect(dbMock.updateUserById).not.toHaveBeenCalled();
  });

  it("rejects for accounts without local password", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    dbMock.getDb.mockResolvedValue({});
    dbMock.getUserByOpenId.mockResolvedValue({
      ...ctx.user,
      passwordHash: null,
      loginMethod: "google",
    });

    await expect(
      caller.auth.changePassword({
        currentPassword: "any-password",
        newPassword: "new-password-123",
      })
    ).rejects.toMatchObject<Partial<TRPCError>>({
      message: "Sua conta não usa senha local para login.",
    });

    expect(dbMock.updateUserById).not.toHaveBeenCalled();
  });

  it("rejects when email is not verified", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const oldHash = await bcrypt.hash("old-password", 10);

    dbMock.getDb.mockResolvedValue({});
    dbMock.getUserByOpenId.mockResolvedValue({
      ...ctx.user,
      emailVerified: false,
      emailVerifiedAt: null,
      passwordHash: oldHash,
    });

    await expect(
      caller.auth.changePassword({
        currentPassword: "old-password",
        newPassword: "new-password-123",
      }),
    ).rejects.toMatchObject<Partial<TRPCError>>({
      message: "Confirme seu email antes de alterar a senha.",
    });

    expect(dbMock.updateUserById).not.toHaveBeenCalled();
  });
});
