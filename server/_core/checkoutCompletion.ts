import { jwtVerify, SignJWT } from "jose";
import type { OrbitaPlan } from "@shared/planAccess";
import { ENV } from "./env";

const CHECKOUT_COMPLETION_PURPOSE = "checkout_completion";
const CHECKOUT_COMPLETION_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

type CheckoutCompletionPayload = {
  openId: string;
  email: string;
  plan: OrbitaPlan;
  purpose: typeof CHECKOUT_COMPLETION_PURPOSE;
};

function getCheckoutCompletionSecret() {
  const secret = ENV.cookieSecret;
  if (!secret) {
    throw new Error("JWT_SECRET não está configurado no .env");
  }
  return new TextEncoder().encode(secret);
}

function isOrbitaPlan(value: unknown): value is OrbitaPlan {
  return (
    value === "personal_standard" ||
    value === "personal_pro" ||
    value === "business_standard" ||
    value === "business_pro"
  );
}

export async function createCheckoutCompletionToken(input: {
  openId: string;
  email: string;
  plan: OrbitaPlan;
}) {
  const secretKey = getCheckoutCompletionSecret();
  const expiresAtSeconds =
    Math.floor(Date.now() / 1000) + CHECKOUT_COMPLETION_EXPIRY_SECONDS;

  return new SignJWT({
    openId: input.openId,
    email: input.email,
    plan: input.plan,
    purpose: CHECKOUT_COMPLETION_PURPOSE,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expiresAtSeconds)
    .sign(secretKey);
}

export async function verifyCheckoutCompletionToken(
  token: string,
): Promise<CheckoutCompletionPayload | null> {
  try {
    const secretKey = getCheckoutCompletionSecret();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    const openId = payload.openId;
    const email = payload.email;
    const plan = payload.plan;
    const purpose = payload.purpose;

    if (
      typeof openId !== "string" ||
      typeof email !== "string" ||
      !isOrbitaPlan(plan) ||
      purpose !== CHECKOUT_COMPLETION_PURPOSE
    ) {
      return null;
    }

    return {
      openId,
      email,
      plan,
      purpose: CHECKOUT_COMPLETION_PURPOSE,
    };
  } catch {
    return null;
  }
}
