import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const dbMock = vi.hoisted(() => ({
  getDb: vi.fn(),
  getUserByOpenId: vi.fn(),
  updateUserById: vi.fn(),
  deleteUserAndAuthTokensById: vi.fn(),
}));

const checkoutCompletionMock = vi.hoisted(() => ({
  createCheckoutCompletionToken: vi.fn(),
  verifyCheckoutCompletionToken: vi.fn(),
}));

const sdkMock = vi.hoisted(() => ({
  sdk: {
    createSessionToken: vi.fn().mockResolvedValue("session_token_checkout_123"),
  },
}));

vi.mock("./db", () => dbMock);
vi.mock("./_core/checkoutCompletion", () => checkoutCompletionMock);
vi.mock("./_core/sdk", () => sdkMock);

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

function createCheckoutUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 14,
    openId: "local_checkout_14",
    name: "Ana Silva",
    firstName: "Ana",
    lastName: "Silva",
    email: "ana@orbita.app",
    whatsapp: "+5511999999999",
    city: null,
    address: null,
    acquisitionSource: null,
    preferredLanguage: null,
    marketingOptIn: false,
    taxIdType: "cpf",
    taxIdEncrypted: "encrypted_tax_id",
    taxIdLast4: "4705",
    passwordHash: "bcrypt_hash",
    emailVerified: false,
    emailVerifiedAt: null,
    loginMethod: "email",
    role: "user",
    plan: "business_standard",
    planStatus: "past_due",
    planExpiry: null,
    asaasCustomerId: null,
    asaasSubscriptionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

describe("checkout completion flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getDb.mockResolvedValue({});
    checkoutCompletionMock.verifyCheckoutCompletionToken.mockResolvedValue({
      openId: "local_checkout_14",
      email: "ana@orbita.app",
      plan: "business_standard",
      purpose: "checkout_completion",
    });
  });

  it("returns pending context while payment is still not active", async () => {
    dbMock.getUserByOpenId.mockResolvedValue(createCheckoutUser());

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.getCheckoutCompletionContext({
      token: "checkout_completion_token_123",
    });

    expect(result).toEqual(
      expect.objectContaining({
        firstName: "Ana",
        email: "ana@orbita.app",
        plan: "business_standard",
        planStatus: "past_due",
        profileCompleted: false,
        canAccessPlatform: false,
      }),
    );
  });

  it("saves complementary profile fields without unlocking platform before activation", async () => {
    dbMock.getUserByOpenId.mockResolvedValue(createCheckoutUser());
    dbMock.updateUserById.mockResolvedValue(
      createCheckoutUser({
        city: "São Paulo",
        address: "Rua Teste, 123",
        acquisitionSource: "Instagram",
        preferredLanguage: "Português (Brasil)",
        marketingOptIn: true,
      }),
    );

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.completeCheckoutProfile({
      token: "checkout_completion_token_123",
      profile: {
        city: "São Paulo",
        address: "Rua Teste, 123",
        acquisitionSource: "Instagram",
        preferredLanguage: "Português (Brasil)",
        marketingOptIn: true,
      },
    });

    expect(result).toEqual({
      success: true,
      profileCompleted: true,
      canAccessPlatform: false,
    });
    expect(dbMock.updateUserById).toHaveBeenCalledWith(
      14,
      expect.objectContaining({
        city: "São Paulo",
        address: "Rua Teste, 123",
        acquisitionSource: "Instagram",
        preferredLanguage: "Português (Brasil)",
        marketingOptIn: true,
      }),
    );
  });

  it("refuses activation while profile is still incomplete", async () => {
    dbMock.getUserByOpenId.mockResolvedValue(createCheckoutUser({
      planStatus: "active",
    }));

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.activateCheckoutAccess({
      token: "checkout_completion_token_123",
    });

    expect(result).toEqual({
      success: false,
      canAccessPlatform: false,
      planStatus: "active",
      profileCompleted: false,
    });
    expect((ctx.res as { cookie: ReturnType<typeof vi.fn> }).cookie).not.toHaveBeenCalled();
  });

  it("creates a session after payment is active and profile is complete", async () => {
    dbMock.getUserByOpenId.mockResolvedValue(
      createCheckoutUser({
        city: "São Paulo",
        address: "Rua Teste, 123",
        acquisitionSource: "Instagram",
        preferredLanguage: "Português (Brasil)",
        planStatus: "active",
      }),
    );

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.activateCheckoutAccess({
      token: "checkout_completion_token_123",
    });

    expect(result).toEqual({
      success: true,
      canAccessPlatform: true,
      planStatus: "active",
      profileCompleted: true,
    });
    expect(sdkMock.sdk.createSessionToken).toHaveBeenCalledWith(
      "local_checkout_14",
      expect.objectContaining({
        name: "Ana Silva",
      }),
    );
    expect((ctx.res as { cookie: ReturnType<typeof vi.fn> }).cookie).toHaveBeenCalledTimes(1);
  });
});
