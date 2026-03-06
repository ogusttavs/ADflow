import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const dbMock = vi.hoisted(() => ({
  getDb: vi.fn(),
  getUserByOpenId: vi.fn(),
  updateUserById: vi.fn(),
  deleteUserAndAuthTokensById: vi.fn(),
}));

const kiwifyMock = vi.hoisted(() => ({
  resolveKiwifyCheckoutUrl: vi.fn(),
}));

const profileCryptoMock = vi.hoisted(() => ({
  decryptProfileSensitiveValue: vi.fn(),
  encryptProfileSensitiveValue: vi.fn((value: string) => `encrypted_${value}`),
}));

vi.mock("./db", () => dbMock);
vi.mock("./_core/kiwify", () => kiwifyMock);
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
    kiwifyMock.resolveKiwifyCheckoutUrl.mockReturnValue("https://pay.kiwify.com.br/checkout-123");
    profileCryptoMock.decryptProfileSensitiveValue.mockReturnValue("39053344705");
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

  it("stores pending selection for non-active user and returns checkout URL", async () => {
    dbMock.getUserByOpenId.mockResolvedValue({
      ...createAuthContext().user,
      asaasCustomerId: null,
      asaasSubscriptionId: null,
      plan: null,
      planStatus: null,
      planExpiry: null,
    });

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.auth.createSubscription({
      plan: "business_standard",
      billingType: "PIX",
    });

    expect(result.success).toBe(true);
    expect(result.checkoutUrl).toBe("https://pay.kiwify.com.br/checkout-123");
    expect(result.planStatus).toBe("past_due");
    expect(kiwifyMock.resolveKiwifyCheckoutUrl).toHaveBeenCalledWith(
      "business_standard",
      expect.objectContaining({
        name: "Usuário Teste",
        email: "user@orbita.app",
        phone: null,
        taxId: null,
        region: "br",
      }),
    );
    expect(dbMock.updateUserById).toHaveBeenCalledTimes(1);
    expect(dbMock.updateUserById).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        plan: "business_standard",
        planStatus: "past_due",
        planExpiry: null,
      }),
    );
  });

  it("does not downgrade active users while generating checkout", async () => {
    dbMock.getUserByOpenId.mockResolvedValue({
      ...createAuthContext().user,
      asaasCustomerId: "ki_customer_1",
      asaasSubscriptionId: "ki_subscription_1",
      plan: "business_standard",
      planStatus: "active",
      planExpiry: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.auth.createSubscription({
      plan: "business_pro",
      billingType: "PIX",
    });

    expect(result.checkoutUrl).toBe("https://pay.kiwify.com.br/checkout-123");
    expect(result.planStatus).toBe("active");
    expect(kiwifyMock.resolveKiwifyCheckoutUrl).toHaveBeenCalledWith(
      "business_pro",
      expect.objectContaining({
        name: "Usuário Teste",
        email: "user@orbita.app",
        phone: null,
        taxId: null,
        region: "br",
      }),
    );
    expect(dbMock.updateUserById).not.toHaveBeenCalled();
  });

  it("prefills Kiwify checkout with stored buyer data when available", async () => {
    dbMock.getUserByOpenId.mockResolvedValue({
      ...createAuthContext().user,
      asaasCustomerId: null,
      asaasSubscriptionId: null,
      whatsapp: "+5511988887777",
      taxIdEncrypted: "encrypted_tax_id",
      taxIdLast4: "4705",
      taxIdType: "cpf",
      plan: null,
      planStatus: null,
      planExpiry: null,
    });

    const caller = appRouter.createCaller(createAuthContext());
    await caller.auth.createSubscription({
      plan: "personal_pro",
      billingType: "PIX",
    });

    expect(profileCryptoMock.decryptProfileSensitiveValue).toHaveBeenCalledWith("encrypted_tax_id");
    expect(kiwifyMock.resolveKiwifyCheckoutUrl).toHaveBeenCalledWith(
      "personal_pro",
      expect.objectContaining({
        name: "Usuário Teste",
        email: "user@orbita.app",
        phone: "+5511988887777",
        taxId: "39053344705",
        region: "br",
      }),
    );
  });

  it("fails when checkout URL is not configured for selected plan", async () => {
    dbMock.getUserByOpenId.mockResolvedValue({
      ...createAuthContext().user,
      plan: null,
      planStatus: null,
      planExpiry: null,
    });
    kiwifyMock.resolveKiwifyCheckoutUrl.mockReturnValue(null);

    const caller = appRouter.createCaller(createAuthContext());

    await expect(
      caller.auth.createSubscription({
        plan: "personal_standard",
        billingType: "PIX",
      }),
    ).rejects.toThrow("Checkout deste plano não configurado na Kiwify.");
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
