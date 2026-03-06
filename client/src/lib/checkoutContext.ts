import type { OrbitaPlan } from "@shared/planAccess";

const CHECKOUT_CONTEXT_KEY = "orbita_checkout_context_v1";

export type PendingCheckoutContext = {
  token: string;
  email: string;
  firstName: string;
  plan: OrbitaPlan;
  createdAt: number;
};

function isOrbitaPlan(value: unknown): value is OrbitaPlan {
  return (
    value === "personal_standard" ||
    value === "personal_pro" ||
    value === "business_standard" ||
    value === "business_pro"
  );
}

export function readPendingCheckoutContext(): PendingCheckoutContext | null {
  if (typeof window === "undefined") return null;

  try {
    const rawValue = window.localStorage.getItem(CHECKOUT_CONTEXT_KEY);
    if (!rawValue) return null;
    const parsed = JSON.parse(rawValue) as Partial<PendingCheckoutContext>;

    if (
      typeof parsed?.token !== "string" ||
      typeof parsed?.email !== "string" ||
      typeof parsed?.firstName !== "string" ||
      typeof parsed?.createdAt !== "number" ||
      !isOrbitaPlan(parsed?.plan)
    ) {
      return null;
    }

    return {
      token: parsed.token,
      email: parsed.email,
      firstName: parsed.firstName,
      plan: parsed.plan,
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
}

export function storePendingCheckoutContext(
  input: Omit<PendingCheckoutContext, "createdAt">,
) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    CHECKOUT_CONTEXT_KEY,
    JSON.stringify({
      ...input,
      createdAt: Date.now(),
    } satisfies PendingCheckoutContext),
  );
}

export function clearPendingCheckoutContext() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CHECKOUT_CONTEXT_KEY);
}
