import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const dbMock = vi.hoisted(() => ({
  getDb: vi.fn(),
  getUserByOpenId: vi.fn(),
  updateUserById: vi.fn(),
  deleteUserAndAuthTokensById: vi.fn(),
}));

const asaasMock = vi.hoisted(() => ({
  createAsaasCustomer: vi.fn(),
  createAsaasSubscription: vi.fn(),
  resolveCheckoutUrlFromSubscriptionPayments: vi.fn(),
  resolveSubscriptionCheckoutUrl: vi.fn(),
}));

const profileCryptoMock = vi.hoisted(() => ({
  decryptProfileSensitiveValue: vi.fn(),
  encryptProfileSensitiveValue: vi.fn((value: string) => `encrypted_${value}`),
}));

vi.mock("./db", () => dbMock);
vi.mock("./_core/asaas", () => asaasMock);
vi.mock("./_core/profileCrypto", () => profileCryptoMock);

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 7,
      openId: "local_7",
      name: "Usuário Teste",
      firstName: "Usuário",
      lastName: "Teste",
      email: "user@orbita.app",
      passwordHash: "hashed-password",
      loginMethod: "email",
      role: "user",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      marketingOptIn: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      whatsapp: null,
      city: null,
      address: null,
      acquisitionSource: null,
      preferredLanguage: null,
      taxIdType: null,
      taxIdEncrypted: null,
      taxIdLast4: null,
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

describe("auth.createSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getDb.mockResolvedValue({});
    asaasMock.resolveSubscriptionCheckoutUrl.mockReturnValue("https://sandbox.asaas.com/pay/123");
    asaasMock.resolveCheckoutUrlFromSubscriptionPayments.mockResolvedValue(null);
  });

  it("blocks subscription activation when email is not verified", async () => {
    dbMock.getUserByOpenId.mockResolvedValue({
      ...createAuthContext().user,
      emailVerified: false,
      emailVerifiedAt: null,
    });

    const caller = appRouter.createCaller(createAuthContext());

    await expect(
      caller.auth.createSubscription({
        plan: "business_standard",
        billingType: "PIX",
      }),
    ).rejects.toThrow("Confirme seu email antes de ativar um plano.");
  });

  it("creates customer/subscription and stores identifiers", async () => {
    dbMock.getUserByOpenId.mockResolvedValue({
      ...createAuthContext().user,
      asaasCustomerId: null,
      asaasSubscriptionId: null,
      plan: null,
      planStatus: null,
      planExpiry: null,
    });
    asaasMock.createAsaasCustomer.mockResolvedValue({ id: "cus_123" });
    asaasMock.createAsaasSubscription.mockResolvedValue({ id: "sub_123" });

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.auth.createSubscription({
      plan: "business_standard",
      billingType: "PIX",
    });

    expect(result.success).toBe(true);
    expect(result.asaasCustomerId).toBe("cus_123");
    expect(result.asaasSubscriptionId).toBe("sub_123");
    expect(dbMock.updateUserById).toHaveBeenCalledTimes(1);
    expect(asaasMock.resolveCheckoutUrlFromSubscriptionPayments).not.toHaveBeenCalled();
  });

  it("uses payment fallback when Asaas does not return checkout url on subscription payload", async () => {
    dbMock.getUserByOpenId.mockResolvedValue({
      ...createAuthContext().user,
      asaasCustomerId: "cus_123",
      asaasSubscriptionId: null,
      plan: null,
      planStatus: null,
      planExpiry: null,
    });
    asaasMock.resolveSubscriptionCheckoutUrl.mockReturnValue(null);
    asaasMock.createAsaasSubscription.mockResolvedValue({ id: "sub_456" });
    asaasMock.resolveCheckoutUrlFromSubscriptionPayments.mockResolvedValue(
      "https://sandbox.asaas.com/pay/fallback",
    );

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.auth.createSubscription({
      plan: "personal_pro",
      billingType: "PIX",
    });

    expect(asaasMock.resolveCheckoutUrlFromSubscriptionPayments).toHaveBeenCalledWith("sub_456");
    expect(result.checkoutUrl).toBe("https://sandbox.asaas.com/pay/fallback");
  });
});

describe("auth.getSubscriptionStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getDb.mockResolvedValue({});
  });

  it("returns grace period as active when overdue is within 3 days", async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    dbMock.getUserByOpenId.mockResolvedValue({
      ...createAuthContext().user,
      plan: "business_standard",
      planStatus: "past_due",
      planExpiry: yesterday,
      asaasCustomerId: "cus_123",
      asaasSubscriptionId: "sub_123",
    });

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.auth.getSubscriptionStatus();

    expect(result.isGracePeriod).toBe(true);
    expect(result.canUsePaidFeatures).toBe(true);
  });
});
