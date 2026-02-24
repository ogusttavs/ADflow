import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("CRM Router", () => {
  it("should have crm.listLeads procedure", () => {
    const caller = appRouter.createCaller(createAuthContext());
    expect(caller.crm).toBeDefined();
    expect(caller.crm.listLeads).toBeDefined();
  });

  it("should have crm.generateIdealLeads procedure", () => {
    const caller = appRouter.createCaller(createAuthContext());
    expect(caller.crm.generateIdealLeads).toBeDefined();
  });

  it("should have crm.listActivities procedure", () => {
    const caller = appRouter.createCaller(createAuthContext());
    expect(caller.crm.listActivities).toBeDefined();
  });
});

describe("A/B Tests Router", () => {
  it("should have abTests.list procedure", () => {
    const caller = appRouter.createCaller(createAuthContext());
    expect(caller.abTests).toBeDefined();
    expect(caller.abTests.list).toBeDefined();
  });

  it("should have abTests.generateVariants procedure", () => {
    const caller = appRouter.createCaller(createAuthContext());
    expect(caller.abTests.generateVariants).toBeDefined();
  });

  it("should have abTests.declareWinner procedure", () => {
    const caller = appRouter.createCaller(createAuthContext());
    expect(caller.abTests.declareWinner).toBeDefined();
  });
});

describe("Reports Router", () => {
  it("should have reports.list procedure", () => {
    const caller = appRouter.createCaller(createAuthContext());
    expect(caller.reports).toBeDefined();
    expect(caller.reports.list).toBeDefined();
  });

  it("should have reports.generate procedure", () => {
    const caller = appRouter.createCaller(createAuthContext());
    expect(caller.reports.generate).toBeDefined();
  });
});

describe("UTM Router", () => {
  it("should have utm.list procedure", () => {
    const caller = appRouter.createCaller(createAuthContext());
    expect(caller.utm).toBeDefined();
    expect(caller.utm.list).toBeDefined();
  });

  it("should have utm.create procedure", () => {
    const caller = appRouter.createCaller(createAuthContext());
    expect(caller.utm.create).toBeDefined();
  });
});

describe("Budget Router", () => {
  it("should have budget.list procedure", () => {
    const caller = appRouter.createCaller(createAuthContext());
    expect(caller.budget).toBeDefined();
    expect(caller.budget.list).toBeDefined();
  });

  it("should have budget.optimizeWithAI procedure", () => {
    const caller = appRouter.createCaller(createAuthContext());
    expect(caller.budget.optimizeWithAI).toBeDefined();
  });
});

describe("Referrals Router", () => {
  it("should have referrals.myReferrals procedure", () => {
    const caller = appRouter.createCaller(createAuthContext());
    expect(caller.referrals).toBeDefined();
    expect(caller.referrals.myReferrals).toBeDefined();
  });

  it("should have referrals.invite procedure", () => {
    const caller = appRouter.createCaller(createAuthContext());
    expect(caller.referrals.invite).toBeDefined();
  });

  it("should have referrals.stats procedure", () => {
    const caller = appRouter.createCaller(createAuthContext());
    expect(caller.referrals.stats).toBeDefined();
  });
});

describe("Performance Router", () => {
  it("should have performance.getByPlatform procedure", () => {
    const caller = appRouter.createCaller(createAuthContext());
    expect(caller.performance).toBeDefined();
    expect(caller.performance.getByPlatform).toBeDefined();
  });
});

describe("Auth protection", () => {
  it("should reject unauthenticated access to CRM", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.crm.listLeads({ stage: "all" })).rejects.toThrow();
  });

  it("should reject unauthenticated access to A/B Tests", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.abTests.list({})).rejects.toThrow();
  });

  it("should reject unauthenticated access to Reports", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.reports.list()).rejects.toThrow();
  });
});
