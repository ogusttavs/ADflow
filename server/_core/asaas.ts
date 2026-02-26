import { TRPCError } from "@trpc/server";
import { ENV } from "./env";

const ASAAS_SANDBOX_BASE_URL = "https://sandbox.asaas.com/api/v3";
const ASAAS_PRODUCTION_BASE_URL = "https://api.asaas.com/v3";

export const ORBITA_PLAN_PRICES = {
  personal_standard: 29,
  personal_pro: 49,
  business_standard: 99,
  business_pro: 149,
} as const;

export type OrbitaPlan = keyof typeof ORBITA_PLAN_PRICES;
export type AsaasBillingType = "PIX" | "BOLETO" | "CREDIT_CARD";

type AsaasCustomerResponse = {
  id: string;
  name?: string | null;
  email?: string | null;
};

type AsaasSubscriptionResponse = {
  id: string;
  customer?: string | null;
  nextDueDate?: string | null;
  value?: number | null;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  checkoutUrl?: string | null;
};

type AsaasPaymentResponse = {
  id: string;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  transactionReceiptUrl?: string | null;
};

type AsaasListResponse<T> = {
  data?: T[] | null;
};

function resolveAsaasBaseUrl() {
  const explicitBaseUrl = ENV.asaasApiBaseUrl.trim();
  if (explicitBaseUrl) return explicitBaseUrl.replace(/\/+$/, "");
  if (ENV.asaasEnv === "production") return ASAAS_PRODUCTION_BASE_URL;
  return ASAAS_SANDBOX_BASE_URL;
}

function ensureAsaasConfigured() {
  if (!ENV.asaasApiKey.trim()) {
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Integração de pagamentos indisponível no momento.",
    });
  }
}

async function asaasRequest<T>(path: string, init?: RequestInit): Promise<T> {
  ensureAsaasConfigured();
  const baseUrl = resolveAsaasBaseUrl();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        access_token: ENV.asaasApiKey.trim(),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Falha de conexão com o gateway de pagamento. Tente novamente em instantes.",
    });
  }

  const raw = await response.text();
  let payload: unknown = {};
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    const payloadRecord =
      payload && typeof payload === "object" && !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : {};
    const errors = Array.isArray(payloadRecord.errors) ? payloadRecord.errors : [];
    const firstError =
      errors[0] && typeof errors[0] === "object" && !Array.isArray(errors[0])
        ? (errors[0] as Record<string, unknown>)
        : null;
    const description =
      firstError && typeof firstError.description === "string"
        ? firstError.description
        : null;
    const payloadMessage =
      typeof payloadRecord.message === "string" ? payloadRecord.message : null;
    const message =
      description ||
      payloadMessage ||
      "Falha ao comunicar com o gateway de pagamento.";

    throw new TRPCError({
      code: "BAD_REQUEST",
      message,
    });
  }

  return payload as T;
}

export async function createAsaasCustomer(input: {
  name: string;
  email?: string | null;
  cpfCnpj?: string | null;
  mobilePhone?: string | null;
  externalReference?: string | null;
}) {
  return asaasRequest<AsaasCustomerResponse>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      email: input.email || undefined,
      cpfCnpj: input.cpfCnpj || undefined,
      mobilePhone: input.mobilePhone || undefined,
      externalReference: input.externalReference || undefined,
    }),
  });
}

export async function createAsaasSubscription(input: {
  customer: string;
  plan: OrbitaPlan;
  billingType: AsaasBillingType;
  nextDueDate: string;
  cycle?: "MONTHLY";
}) {
  const value = ORBITA_PLAN_PRICES[input.plan];

  return asaasRequest<AsaasSubscriptionResponse>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: input.customer,
      billingType: input.billingType,
      nextDueDate: input.nextDueDate,
      value,
      cycle: input.cycle ?? "MONTHLY",
      description: `Orbita - ${input.plan}`,
    }),
  });
}

function resolvePaymentCheckoutUrl(payment: AsaasPaymentResponse): string | null {
  const candidates = [
    payment.invoiceUrl,
    payment.bankSlipUrl,
    payment.transactionReceiptUrl,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
}

export async function listAsaasSubscriptionPayments(subscriptionId: string) {
  const path = `/subscriptions/${encodeURIComponent(subscriptionId)}/payments?limit=10&offset=0`;
  return asaasRequest<AsaasListResponse<AsaasPaymentResponse>>(path, {
    method: "GET",
  });
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function resolveCheckoutUrlFromSubscriptionPayments(
  subscriptionId: string,
): Promise<string | null> {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await listAsaasSubscriptionPayments(subscriptionId);
    const payments = Array.isArray(response.data) ? response.data : [];
    for (const payment of payments) {
      const url = resolvePaymentCheckoutUrl(payment);
      if (url) return url;
    }
    if (attempt < maxAttempts) {
      await sleep(350);
    }
  }
  return null;
}

export function resolveSubscriptionCheckoutUrl(
  subscription: AsaasSubscriptionResponse,
): string | null {
  const candidates = [
    subscription.checkoutUrl,
    subscription.invoiceUrl,
    subscription.bankSlipUrl,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
}
