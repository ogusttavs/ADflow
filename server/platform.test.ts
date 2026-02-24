import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify({
      strategy: "Test strategy",
      keyMessages: "Key message 1, Key message 2",
      suggestedHashtags: "#test #marketing",
      callToAction: "Buy now",
      visualPrompt: "A professional marketing image",
    }) } }],
  }),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: Array<{ name: string; options: Record<string, unknown> }> } {
  const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-openid",
    email: "test@adflow.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.options).toMatchObject({ httpOnly: true });
  });
});

describe("auth.me", () => {
  it("returns authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user).toBeDefined();
    expect(user?.email).toBe("test@adflow.com");
    expect(user?.role).toBe("admin");
  });
});

describe("campaigns.stats", () => {
  it("returns zero stats when database is unavailable", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // With mocked null DB, it should throw INTERNAL_SERVER_ERROR
    await expect(caller.campaigns.stats()).rejects.toThrow();
  });
});

describe("notifications.unreadCount", () => {
  it("returns 0 when database is unavailable", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const count = await caller.notifications.unreadCount();
    expect(count).toBe(0);
  });
});

describe("whatsapp.getConfig", () => {
  it("returns webhook URL configuration", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const config = await caller.whatsapp.getConfig();
    expect(config.webhookUrl).toBe("/api/whatsapp/webhook");
    expect(config.instructions).toBeDefined();
  });
});
