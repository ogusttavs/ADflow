import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const dbMock = vi.hoisted(() => ({
  getDb: vi.fn(),
  getUserByEmail: vi.fn(),
  getUserCount: vi.fn(),
  upsertUser: vi.fn(),
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

const checkoutCompletionMock = vi.hoisted(() => ({
  createCheckoutCompletionToken: vi.fn().mockResolvedValue("checkout_completion_token_123"),
  verifyCheckoutCompletionToken: vi.fn(),
}));

const kiwifyMock = vi.hoisted(() => ({
  resolveKiwifyCheckoutUrl: vi.fn(),
}));

const profileCryptoMock = vi.hoisted(() => ({
  encryptProfileSensitiveValue: vi.fn((value: string) => `encrypted_${value}`),
  decryptProfileSensitiveValue: vi.fn(),
}));

vi.mock("./db", () => dbMock);
vi.mock("./_core/email", () => emailMock);
vi.mock("./_core/authToken", () => authTokenMock);
vi.mock("./_core/checkoutCompletion", () => checkoutCompletionMock);
vi.mock("./_core/kiwify", () => kiwifyMock);
vi.mock("./_core/profileCrypto", () => profileCryptoMock);

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

describe("auth.registerForCheckout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getDb.mockResolvedValue({});
    dbMock.getUserByEmail.mockResolvedValue(undefined);
    dbMock.getUserCount.mockResolvedValue(3);
    dbMock.upsertUser.mockResolvedValue(undefined);
    dbMock.getUserByOpenId.mockResolvedValue({
      id: 22,
      openId: "local_checkout_22",
      name: "Gustavo Silva",
      email: "gustavo@example.com",
    });
    dbMock.createAuthToken.mockResolvedValue(10);
    kiwifyMock.resolveKiwifyCheckoutUrl.mockReturnValue("https://pay.kiwify.com.br/checkout-123");
  });

  it("creates the account with pending plan and returns checkout url without session", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.registerForCheckout({
      firstName: "Gustavo",
      lastName: "Silva",
      email: "gustavo@example.com",
      whatsapp: "+5511999999999",
      city: "Sao Paulo",
      address: "Rua Teste, 123",
      acquisitionSource: "Instagram",
      preferredLanguage: "Portugues (Brasil)",
      taxId: "39053344705",
      marketingOptIn: true,
      password: "NovaSenha@123",
      plan: "business_standard",
    });

    expect(result).toEqual({
      success: true,
      plan: "business_standard",
      planStatus: "past_due",
      checkoutUrl: "https://pay.kiwify.com.br/checkout-123",
      checkoutCompletionToken: "checkout_completion_token_123",
      emailVerificationRequired: true,
    });
    expect(kiwifyMock.resolveKiwifyCheckoutUrl).toHaveBeenCalledWith(
      "business_standard",
      expect.objectContaining({
        name: "Gustavo Silva",
        email: "gustavo@example.com",
        phone: "+5511999999999",
        taxId: "39053344705",
        region: "br",
      }),
    );
    expect(checkoutCompletionMock.createCheckoutCompletionToken).toHaveBeenCalledWith({
      openId: "local_checkout_22",
      email: "gustavo@example.com",
      plan: "business_standard",
    });
    expect(dbMock.upsertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "gustavo@example.com",
        plan: "business_standard",
        planStatus: "past_due",
        emailVerified: false,
      }),
    );
    expect(emailMock.sendTransactionalEmail).toHaveBeenCalledTimes(1);
    expect((ctx.res as { cookie: ReturnType<typeof vi.fn> }).cookie).not.toHaveBeenCalled();
  });

  it("fails when the selected plan checkout is not configured", async () => {
    kiwifyMock.resolveKiwifyCheckoutUrl.mockReturnValue(null);
    const caller = appRouter.createCaller(createPublicContext());

    await expect(
      caller.auth.registerForCheckout({
        firstName: "Gustavo",
        lastName: "Silva",
        email: "gustavo@example.com",
        whatsapp: "+5511999999999",
        city: "Sao Paulo",
        address: "Rua Teste, 123",
        acquisitionSource: "Instagram",
        preferredLanguage: "Portugues (Brasil)",
        taxId: "39053344705",
        marketingOptIn: true,
        password: "NovaSenha@123",
        plan: "business_standard",
      }),
    ).rejects.toThrow("Checkout deste plano não configurado na Kiwify.");
  });
});
