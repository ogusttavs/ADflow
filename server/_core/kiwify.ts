import type { OrbitaPlan } from "@shared/planAccess";
import { ENV } from "./env";

export type KiwifyCheckoutPrefill = {
  name?: string | null;
  email?: string | null;
  taxId?: string | null;
  phone?: string | null;
  region?: "br" | "intl" | null;
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanEnvValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizePhoneForKiwify(value: string | null | undefined) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";

  const hasBrazilCountryCode =
    digits.startsWith("55") && (digits.length === 12 || digits.length === 13);
  return hasBrazilCountryCode ? digits.slice(2) : digits;
}

function normalizeCpfForKiwify(value: string | null | undefined) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length === 11 ? digits : "";
}

function appendKiwifyCheckoutPrefill(
  checkoutUrl: string,
  prefill?: KiwifyCheckoutPrefill,
) {
  if (!prefill) return checkoutUrl;

  const url = new URL(checkoutUrl);
  const normalizedName = String(prefill.name ?? "").trim();
  const normalizedEmail = String(prefill.email ?? "").trim().toLowerCase();
  const normalizedPhone = normalizePhoneForKiwify(prefill.phone);
  const normalizedCpf = normalizeCpfForKiwify(prefill.taxId);
  const normalizedRegion = String(prefill.region ?? "").trim().toLowerCase();

  if (normalizedName) url.searchParams.set("name", normalizedName);
  if (normalizedEmail) url.searchParams.set("email", normalizedEmail);
  if (normalizedPhone) url.searchParams.set("phone", normalizedPhone);
  if (normalizedCpf) url.searchParams.set("cpf", normalizedCpf);
  if (normalizedRegion === "br" || normalizedRegion === "intl") {
    url.searchParams.set("region", normalizedRegion);
  }

  return url.toString();
}

const PLAN_CHECKOUT_URLS: Record<OrbitaPlan, string> = {
  personal_standard: ENV.kiwifyCheckoutUrlPersonalStandard,
  personal_pro: ENV.kiwifyCheckoutUrlPersonalPro,
  business_standard: ENV.kiwifyCheckoutUrlBusinessStandard,
  business_pro: ENV.kiwifyCheckoutUrlBusinessPro,
};

const PLAN_OFFER_IDS: Record<OrbitaPlan, string> = {
  personal_standard: ENV.kiwifyOfferIdPersonalStandard,
  personal_pro: ENV.kiwifyOfferIdPersonalPro,
  business_standard: ENV.kiwifyOfferIdBusinessStandard,
  business_pro: ENV.kiwifyOfferIdBusinessPro,
};

function hasWord(text: string, token: string) {
  const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(^|[\\s_-])${escapedToken}($|[\\s_-])`);
  return regex.test(text);
}

export function resolveKiwifyCheckoutUrl(
  plan: OrbitaPlan,
  prefill?: KiwifyCheckoutPrefill,
): string | null {
  const checkoutUrl = cleanEnvValue(PLAN_CHECKOUT_URLS[plan]);
  if (!checkoutUrl) return null;
  return appendKiwifyCheckoutPrefill(checkoutUrl, prefill);
}

export function resolvePlanFromKiwifyOfferId(offerId: string | null | undefined): OrbitaPlan | null {
  const normalizedOfferId = cleanEnvValue(offerId ?? "");
  if (!normalizedOfferId) return null;

  for (const [plan, configuredId] of Object.entries(PLAN_OFFER_IDS) as Array<[OrbitaPlan, string]>) {
    if (!configuredId.trim()) continue;
    if (configuredId.trim() === normalizedOfferId) return plan;
  }
  return null;
}

export function resolvePlanFromKiwifyLabel(label: string | null | undefined): OrbitaPlan | null {
  const normalized = normalizeText(label ?? "");
  if (!normalized) return null;

  if (
    normalized === "personal_standard" ||
    normalized === "personal standard" ||
    normalized === "pessoal_standard" ||
    normalized === "pessoal standard"
  ) {
    return "personal_standard";
  }
  if (
    normalized === "personal_pro" ||
    normalized === "personal pro" ||
    normalized === "pessoal_pro" ||
    normalized === "pessoal pro"
  ) {
    return "personal_pro";
  }
  if (
    normalized === "business_standard" ||
    normalized === "business standard" ||
    normalized === "empresa standard" ||
    normalized === "negocio standard"
  ) {
    return "business_standard";
  }
  if (
    normalized === "business_pro" ||
    normalized === "business pro" ||
    normalized === "empresa pro" ||
    normalized === "negocio pro"
  ) {
    return "business_pro";
  }

  const hasBusinessMarker =
    normalized.includes("business") ||
    normalized.includes("empresa") ||
    normalized.includes("negocio") ||
    normalized.includes("agencia") ||
    normalized.includes("comercial");
  const hasPersonalMarker =
    normalized.includes("personal") ||
    normalized.includes("pessoal") ||
    normalized.includes("individual") ||
    normalized.includes("autonomo");
  const hasProMarker = hasWord(normalized, "pro");
  const hasStandardMarker = hasWord(normalized, "standard") || hasWord(normalized, "padrao");

  if (hasBusinessMarker && hasProMarker) return "business_pro";
  if (hasBusinessMarker && (hasStandardMarker || !hasProMarker)) return "business_standard";
  if (hasPersonalMarker && hasProMarker) return "personal_pro";
  if (hasPersonalMarker && (hasStandardMarker || !hasProMarker)) return "personal_standard";

  return null;
}
