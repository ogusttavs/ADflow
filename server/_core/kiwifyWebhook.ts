import type { OrbitaPlan } from "@shared/planAccess";
import * as db from "../db";
import { resolvePlanFromKiwifyLabel, resolvePlanFromKiwifyOfferId } from "./kiwify";

type JsonRecord = Record<string, unknown>;

type BillingStatus = "active" | "past_due" | "canceled";

const ACTIVE_KEYWORDS = [
  "APPROVED",
  "PAID",
  "CONFIRMED",
  "ACTIVE",
  "COMPLETED",
  "RECEIVED",
  "APROVAD",
  "RENOVAD",
  "SUBSCRIPTION_RENEWED",
  "COMPRA_APROVADA",
];
const PAST_DUE_KEYWORDS = [
  "DECLINED",
  "FAILED",
  "OVERDUE",
  "PAST_DUE",
  "UNPAID",
  "EXPIRED",
  "LATE",
  "DENIED",
  "RECUSAD",
  "ATRASAD",
  "SUBSCRIPTION_LATE",
  "COMPRA_RECUSADA",
];
const CANCELED_KEYWORDS = [
  "REFUND",
  "REFUNDED",
  "CHARGEBACK",
  "CANCEL",
  "CANCELED",
  "CANCELLED",
  "REVERSED",
  "DISPUTE",
  "ESTORNO",
  "ESTORNAD",
  "REEMBOLSAD",
  "SUBSCRIPTION_CANCELED",
  "COMPRA_REEMBOLSADA",
];
const PENDING_KEYWORDS = ["PENDING", "WAITING", "GENERATED", "CREATED"];

const EVENT_TYPE_PATHS: string[][] = [
  ["event"],
  ["eventType"],
  ["type"],
  ["status"],
  ["order_status"],
  ["payment_status"],
  ["subscription_status"],
  ["data", "event"],
  ["data", "eventType"],
  ["data", "status"],
];

const STATUS_HINT_PATHS: string[][] = [
  ["status"],
  ["order_status"],
  ["payment_status"],
  ["subscription_status"],
  ["data", "status"],
];

const EVENT_ID_PATHS: string[][] = [
  ["id"],
  ["event_id"],
  ["eventId"],
  ["webhook_id"],
  ["webhookId"],
  ["data", "id"],
  ["order", "id"],
  ["order", "order_id"],
  ["transaction", "id"],
  ["payment", "id"],
  ["subscription", "id"],
  ["subscription_id"],
];

const EMAIL_PATHS: string[][] = [
  ["email"],
  ["customer_email"],
  ["buyer_email"],
  ["customer", "email"],
  ["buyer", "email"],
  ["order", "email"],
  ["order", "customer_email"],
  ["order", "customer", "email"],
  ["subscription", "email"],
  ["subscription", "customer", "email"],
  ["data", "customer", "email"],
  ["data", "buyer", "email"],
];

const SUBSCRIPTION_ID_PATHS: string[][] = [
  ["subscription_id"],
  ["subscription", "id"],
  ["order", "subscription_id"],
  ["payment", "subscription_id"],
  ["payment", "subscription"],
  ["transaction", "subscription_id"],
  ["data", "subscription_id"],
  ["data", "subscription", "id"],
];

const CUSTOMER_ID_PATHS: string[][] = [
  ["customer_id"],
  ["customer", "id"],
  ["buyer", "id"],
  ["order", "customer_id"],
  ["order", "customer", "id"],
  ["data", "customer_id"],
  ["data", "customer", "id"],
];

const OFFER_ID_PATHS: string[][] = [
  ["offer_id"],
  ["offer", "id"],
  ["product_id"],
  ["product", "id"],
  ["order", "offer_id"],
  ["order", "product_id"],
  ["subscription", "offer_id"],
  ["data", "offer_id"],
  ["data", "offer", "id"],
];

const PLAN_LABEL_PATHS: string[][] = [
  ["plan"],
  ["plan_name"],
  ["offer_name"],
  ["product_name"],
  ["offer", "name"],
  ["offer", "title"],
  ["product", "name"],
  ["product", "title"],
  ["order", "plan"],
  ["order", "plan_name"],
  ["order", "offer_name"],
  ["order", "product_name"],
  ["order", "product", "name"],
  ["subscription", "plan_name"],
  ["subscription", "offer_name"],
  ["data", "plan_name"],
  ["data", "offer_name"],
  ["data", "offer", "name"],
];

const PLAN_EXPIRY_PATHS: string[][] = [
  ["expires_at"],
  ["expiration_date"],
  ["next_payment_date"],
  ["next_charge_date"],
  ["due_date"],
  ["order", "due_date"],
  ["order", "next_payment_date"],
  ["order", "next_charge_date"],
  ["payment", "dueDate"],
  ["payment", "due_date"],
  ["subscription", "next_payment_date"],
  ["subscription", "next_charge_date"],
  ["subscription", "expires_at"],
  ["subscription", "end_date"],
  ["transaction", "due_date"],
];

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as JsonRecord;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getNestedValue(payload: JsonRecord, path: string[]): unknown {
  let current: unknown = payload;
  for (const segment of path) {
    const currentRecord = asRecord(current);
    if (!currentRecord) return null;
    current = currentRecord[segment];
  }
  return current;
}

function pickFirstString(payload: JsonRecord, paths: string[][]): string | null {
  for (const path of paths) {
    const value = asString(getNestedValue(payload, path));
    if (value) return value;
  }
  return null;
}

function normalizeEventType(value: string) {
  return value.trim().replace(/\s+/g, "_").replace(/-/g, "_").toUpperCase();
}

function normalizeEmail(value: string | null) {
  return value ? value.trim().toLowerCase() : null;
}

function parseDateValue(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value > 1_000_000_000_000 ? value : value * 1000;
    const parsed = new Date(millis);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    return null;
  }

  if (typeof value !== "string" || !value.trim()) return null;
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      const millis = numeric > 1_000_000_000_000 ? numeric : numeric * 1000;
      const parsed = new Date(millis);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function resolvePlanExpiry(payload: JsonRecord): Date | null {
  for (const path of PLAN_EXPIRY_PATHS) {
    const parsed = parseDateValue(getNestedValue(payload, path));
    if (parsed) return parsed;
  }
  return null;
}

function includesAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

function classifyEvent(eventType: string): BillingStatus | null {
  const normalized = normalizeEventType(eventType);

  if (includesAny(normalized, CANCELED_KEYWORDS)) return "canceled";
  if (includesAny(normalized, PAST_DUE_KEYWORDS)) return "past_due";
  if (includesAny(normalized, ACTIVE_KEYWORDS)) return "active";
  if (includesAny(normalized, PENDING_KEYWORDS)) return null;

  return null;
}

function resolveEventType(payload: JsonRecord): string | null {
  const fromPayload = pickFirstString(payload, EVENT_TYPE_PATHS);
  if (!fromPayload) return null;
  return normalizeEventType(fromPayload);
}

function resolveSubscriptionId(payload: JsonRecord): string | null {
  return pickFirstString(payload, SUBSCRIPTION_ID_PATHS);
}

function resolveCustomerId(payload: JsonRecord): string | null {
  return pickFirstString(payload, CUSTOMER_ID_PATHS);
}

function resolveCustomerEmail(payload: JsonRecord): string | null {
  return normalizeEmail(pickFirstString(payload, EMAIL_PATHS));
}

function resolvePlanFromPayload(payload: JsonRecord): OrbitaPlan | null {
  const explicitPlan = pickFirstString(payload, PLAN_LABEL_PATHS);
  const fromExplicitPlan = resolvePlanFromKiwifyLabel(explicitPlan);
  if (fromExplicitPlan) return fromExplicitPlan;

  const offerId = pickFirstString(payload, OFFER_ID_PATHS);
  const fromOfferId = resolvePlanFromKiwifyOfferId(offerId);
  if (fromOfferId) return fromOfferId;

  return null;
}

function resolveEventId(payload: JsonRecord, eventType: string): string | null {
  const directEventId = pickFirstString(payload, EVENT_ID_PATHS);
  if (directEventId) return directEventId;

  const fallbackParts = [
    eventType,
    resolveSubscriptionId(payload),
    resolveCustomerId(payload),
    resolveCustomerEmail(payload),
    pickFirstString(payload, [["status"], ["order_status"], ["payment_status"]]),
  ].filter(Boolean);

  if (fallbackParts.length === 0) return null;
  return fallbackParts.join(":").slice(0, 120);
}

async function findLinkedUser(payload: JsonRecord) {
  const subscriptionId = resolveSubscriptionId(payload);
  const customerId = resolveCustomerId(payload);
  const email = resolveCustomerEmail(payload);

  if (subscriptionId) {
    const bySubscription = await db.getUserByAsaasSubscriptionId(subscriptionId);
    if (bySubscription) {
      return { user: bySubscription, subscriptionId, customerId, email };
    }
  }

  if (customerId) {
    const byCustomer = await db.getUserByAsaasCustomerId(customerId);
    if (byCustomer) {
      return { user: byCustomer, subscriptionId, customerId, email };
    }
  }

  if (email) {
    const byEmail = await db.getUserByEmail(email);
    if (byEmail) {
      return { user: byEmail, subscriptionId, customerId, email };
    }
  }

  return null;
}

export async function processKiwifyWebhookPayload(payloadInput: unknown) {
  const payload = asRecord(payloadInput);
  if (!payload) return { ok: true, ignored: true, reason: "invalid_payload" } as const;

  const eventType = resolveEventType(payload);
  if (!eventType) return { ok: true, ignored: true, reason: "missing_event_type" } as const;

  const eventId = resolveEventId(payload, eventType);
  if (!eventId) return { ok: true, ignored: true, reason: "missing_event_id" } as const;

  const alreadyProcessed = await db.getProcessedWebhookEventByEventId(eventId);
  if (alreadyProcessed) {
    return { ok: true, ignored: true, reason: "already_processed", eventType, eventId } as const;
  }

  const linked = await findLinkedUser(payload);
  if (!linked) {
    await db.createProcessedWebhookEvent({
      provider: "kiwify",
      eventId,
      eventType,
    });
    return { ok: true, ignored: true, reason: "user_not_found", eventType, eventId } as const;
  }

  const updates: Parameters<typeof db.updateUserById>[1] = {};
  if (linked.customerId) updates.asaasCustomerId = linked.customerId;
  if (linked.subscriptionId) updates.asaasSubscriptionId = linked.subscriptionId;

  const resolvedPlan = resolvePlanFromPayload(payload);
  if (resolvedPlan) updates.plan = resolvedPlan;

  const statusHint = pickFirstString(payload, STATUS_HINT_PATHS);
  const planStatus =
    classifyEvent(eventType) ||
    (statusHint ? classifyEvent(statusHint) : null);
  if (planStatus) {
    updates.planStatus = planStatus;
  }

  const resolvedExpiry = resolvePlanExpiry(payload);
  if (resolvedExpiry) {
    updates.planExpiry = resolvedExpiry;
  } else if (planStatus === "canceled") {
    updates.planExpiry = new Date();
  }

  if (Object.keys(updates).length > 0) {
    await db.updateUserById(linked.user.id, updates);
  }

  await db.createProcessedWebhookEvent({
    provider: "kiwify",
    eventId,
    eventType,
  });

  return { ok: true, ignored: false, eventType, eventId } as const;
}
