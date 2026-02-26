import { beforeEach, describe, expect, it, vi } from "vitest";
import { UPGRADE_REQUIRED_ERR_MSG } from "@shared/const";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const dbMock = vi.hoisted(() => ({
  getUserByOpenId: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock("./db", () => dbMock);

function createAuthContext(): TrpcContext {
  const now = new Date();

  return {
    user: {
      id: 99,
      openId: "local_99",
      role: "user",
      loginMethod: "email",
      name: "Plano Teste",
      firstName: "Plano",
      lastName: "Teste",
      email: "plano@orbita.app",
      whatsapp: null,
      city: null,
      address: null,
      acquisitionSource: null,
      preferredLanguage: null,
      marketingOptIn: false,
      emailVerified: true,
      emailVerifiedAt: now,
      taxIdType: null,
      taxIdEncrypted: null,
      taxIdLast4: null,
      passwordHash: "hash",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("planProcedure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks business modules when plan does not have access", async () => {
    dbMock.getUserByOpenId.mockResolvedValue({
      ...createAuthContext().user,
      plan: "personal_standard",
      planStatus: "active",
      planExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const caller = appRouter.createCaller(createAuthContext());

    await expect(caller.clients.list()).rejects.toThrow(UPGRADE_REQUIRED_ERR_MSG);
    expect(dbMock.getDb).not.toHaveBeenCalled();
  });

  it("allows access during grace period for business plans", async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    dbMock.getUserByOpenId.mockResolvedValue({
      ...createAuthContext().user,
      plan: "business_standard",
      planStatus: "past_due",
      planExpiry: yesterday,
    });

    const orderBy = vi.fn().mockResolvedValue([]);
    const where = vi.fn().mockReturnValue({ orderBy });
    const from = vi.fn().mockReturnValue({ where });
    const select = vi.fn().mockReturnValue({ from });

    dbMock.getDb.mockResolvedValue({
      select,
    });

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.clients.list();

    expect(result).toEqual([]);
    expect(dbMock.getDb).toHaveBeenCalledTimes(1);
  });
});

