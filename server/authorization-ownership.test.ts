import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mockState = vi.hoisted(() => ({
  selectQueue: [] as unknown[][],
}));

type QueryChain = {
  where: (...args: unknown[]) => QueryChain;
  orderBy: (...args: unknown[]) => QueryChain;
  limit: (...args: unknown[]) => QueryChain;
  then: <TResult1 = unknown[], TResult2 = never>(
    onfulfilled?: ((value: unknown[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) => Promise<TResult1 | TResult2>;
};

function createQueryChain(rows: unknown[]): QueryChain {
  const chain: QueryChain = {
    where: () => chain,
    orderBy: () => chain,
    limit: () => chain,
    then: (onfulfilled, onrejected) =>
      Promise.resolve(rows).then(onfulfilled ?? undefined, onrejected ?? undefined),
  };
  return chain;
}

vi.mock("./db", () => ({
  getDb: vi.fn(async () => ({
    select: () => ({
      from: () => createQueryChain(mockState.selectQueue.shift() ?? []),
    }),
    insert: () => ({
      values: async () => [{ insertId: 1 }],
    }),
    update: () => ({
      set: () => ({
        where: async () => undefined,
      }),
    }),
    delete: () => ({
      where: async () => undefined,
    }),
  })),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "{\"summary\":\"ok\",\"recommendations\":\"ok\"}" } }],
  }),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "owner-1",
    email: "owner@example.com",
    name: "Owner",
    loginMethod: "email",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("ownership checks", () => {
  beforeEach(() => {
    mockState.selectQueue.length = 0;
  });

  it("clients.getConfig rejects access to another user's client", async () => {
    mockState.selectQueue.push([]);
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.clients.getConfig({ clientId: 999 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("campaigns.create rejects another user's clientId", async () => {
    mockState.selectQueue.push([]);
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.campaigns.create({ clientId: 999, title: "X", objective: "Y", requestedVia: "web" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("social.listAccounts rejects another user's clientId", async () => {
    mockState.selectQueue.push([]);
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.social.listAccounts({ clientId: 999 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("whatsapp.simulateMessage rejects another user's clientId", async () => {
    mockState.selectQueue.push([{ id: 1 }]);
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.whatsapp.simulateMessage({
        phoneNumber: "+5511999999999",
        message: "oi",
        clientId: 999,
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("performance.getByClient rejects another user's clientId", async () => {
    mockState.selectQueue.push([]);
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.performance.getByClient({ clientId: 999 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("reports.generate rejects another user's clientId", async () => {
    mockState.selectQueue.push([]);
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.reports.generate({
        clientId: 999,
        title: "Relatório",
        type: "performance",
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("crm.addActivity rejects updates for another user's lead", async () => {
    mockState.selectQueue.push([]);
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.crm.addActivity({
        leadId: 999,
        type: "call",
        title: "Follow up",
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

