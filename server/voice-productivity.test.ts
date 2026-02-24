import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import type { Message } from "./_core/llm";

vi.mock("./db", () => {
  let insertId = 1000;

  const buildChain = (rows: any[]) => {
    const chain: any = {
      where: () => chain,
      orderBy: () => chain,
      limit: () => Promise.resolve(rows),
      then: (resolve: (value: any[]) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(rows).then(resolve, reject),
    };
    return chain;
  };

  const db = {
    select: () => ({
      from: () => buildChain([]),
    }),
    insert: () => ({
      values: async () => [{ insertId: insertId++ }],
    }),
    update: () => ({
      set: () => ({
        where: async () => undefined,
      }),
    }),
    delete: () => ({
      where: async () => undefined,
    }),
  };

  return {
    getDb: vi.fn(async () => db),
  };
});

vi.mock("./_core/llm", () => {
  const buildToolResponse = (name: string, args: Record<string, unknown>) => ({
    id: "mock",
    created: Date.now(),
    model: "mock-model",
    choices: [
      {
        index: 0,
        finish_reason: "tool_calls",
        message: {
          role: "assistant" as const,
          content: "",
          tool_calls: [
            {
              id: "tool-1",
              type: "function" as const,
              function: {
                name,
                arguments: JSON.stringify(args),
              },
            },
          ],
        },
      },
    ],
  });

  return {
    invokeLLM: vi.fn(async ({ messages }: { messages: Message[] }) => {
      const userPrompt = messages.find(m => m.role === "user")?.content;
      const text = typeof userPrompt === "string" ? userPrompt.toLowerCase() : "";

      if (text.includes("clientes")) {
        return buildToolResponse("navigate", { page: "clients" });
      }

      return buildToolResponse("addTask", {
        title: "Revisar copies",
        dueDate: "2026-02-25",
        priority: "HIGH",
        category: "WORK",
      });
    }),
  };
});

import { appRouter } from "./routers";

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("productivity router", () => {
  it("listHabits returns array", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.productivity.listHabits();
    expect(Array.isArray(result)).toBe(true);
  });

  it("listTasks returns array", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.productivity.listTasks();
    expect(Array.isArray(result)).toBe(true);
  });

  it("listPomodoros returns array", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.productivity.listPomodoros();
    expect(Array.isArray(result)).toBe(true);
  });

  it("pomodoroStats returns stats object", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.productivity.pomodoroStats();
    expect(result).toHaveProperty("todayCount");
    expect(result).toHaveProperty("weekCount");
    expect(result).toHaveProperty("totalCount");
  });

  it("dailyBriefing returns briefing object", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.productivity.dailyBriefing();
    expect(result).toHaveProperty("todayTasks");
    expect(result).toHaveProperty("overdueTasks");
    expect(result).toHaveProperty("todayHabits");
    expect(result).toHaveProperty("yesterdayHabitStats");
    expect(result).toHaveProperty("pomodoroStats");
  });

  it("createTask creates and returns id", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.productivity.createTask({
      title: "Test task from voice command",
      priority: "HIGH",
      category: "WORK",
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("createHabit creates and returns id", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.productivity.createHabit({
      name: "Test habit",
      icon: "🎯",
      daysOfWeek: [1, 3, 5],
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });
});

describe("aiCommand router", () => {
  it("execute returns a result for navigation command", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.aiCommand.execute({ command: "me mostra os clientes" });
    expect(result).toHaveProperty("type");
    expect(result).toHaveProperty("text");
    expect(typeof result.text).toBe("string");
  });

  it("execute returns a result for task creation command", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.aiCommand.execute({ command: "adiciona tarefa: revisar copies amanhã" });
    expect(result).toHaveProperty("type");
    expect(result).toHaveProperty("text");
  });
});
