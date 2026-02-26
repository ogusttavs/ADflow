import * as db from "../db";

type JsonRecord = Record<string, unknown>;

const ACTIVATION_EVENTS = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);
const PAST_DUE_EVENTS = new Set(["PAYMENT_OVERDUE"]);
const CANCELED_EVENTS = new Set(["SUBSCRIPTION_DELETED", "PAYMENT_REFUNDED", "PAYMENT_DELETED"]);

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as JsonRecord;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getEventType(payload: JsonRecord): string | null {
  return asString(payload.event);
}

function getEventId(payload: JsonRecord, eventType: string): string | null {
  const rootId = asString(payload.id);
  if (rootId) return rootId;

  const payment = asRecord(payload.payment);
  const subscription = asRecord(payload.subscription);

  const paymentId = payment ? asString(payment.id) : null;
  const subscriptionId = subscription ? asString(subscription.id) : null;
  const fallback = paymentId || subscriptionId;
  if (!fallback) return null;
  return `${eventType}:${fallback}`;
}

function getDueDate(payload: JsonRecord): Date | null {
  const payment = asRecord(payload.payment);
  const subscription = asRecord(payload.subscription);

  const dateValue =
    (payment && asString(payment.dueDate)) ||
    (payment && asString(payment.nextDueDate)) ||
    (subscription && asString(subscription.nextDueDate)) ||
    (subscription && asString(subscription.dateCreated));

  if (!dateValue) return null;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

async function findLinkedUser(payload: JsonRecord) {
  const payment = asRecord(payload.payment);
  const subscription = asRecord(payload.subscription);

  const subscriptionId =
    (payment && asString(payment.subscription)) ||
    (subscription && asString(subscription.id));
  if (subscriptionId) {
    const bySubscription = await db.getUserByAsaasSubscriptionId(subscriptionId);
    if (bySubscription) {
      return { user: bySubscription, subscriptionId, customerId: null as string | null };
    }
  }

  const customerId =
    (payment && asString(payment.customer)) ||
    (subscription && asString(subscription.customer));
  if (customerId) {
    const byCustomer = await db.getUserByAsaasCustomerId(customerId);
    if (byCustomer) {
      return { user: byCustomer, subscriptionId: subscriptionId ?? null, customerId };
    }
  }

  return null;
}

export async function processAsaasWebhookPayload(payloadInput: unknown) {
  const payload = asRecord(payloadInput);
  if (!payload) return { ok: true, ignored: true, reason: "invalid_payload" } as const;

  const eventType = getEventType(payload);
  if (!eventType) return { ok: true, ignored: true, reason: "missing_event_type" } as const;

  const eventId = getEventId(payload, eventType);
  if (!eventId) return { ok: true, ignored: true, reason: "missing_event_id" } as const;

  const alreadyProcessed = await db.getProcessedWebhookEventByEventId(eventId);
  if (alreadyProcessed) {
    return { ok: true, ignored: true, reason: "already_processed", eventType, eventId } as const;
  }

  const linked = await findLinkedUser(payload);
  if (!linked) {
    await db.createProcessedWebhookEvent({
      provider: "asaas",
      eventId,
      eventType,
    });
    return { ok: true, ignored: true, reason: "user_not_found", eventType, eventId } as const;
  }

  const updates: Parameters<typeof db.updateUserById>[1] = {};

  if (linked.customerId) updates.asaasCustomerId = linked.customerId;
  if (linked.subscriptionId) updates.asaasSubscriptionId = linked.subscriptionId;

  if (ACTIVATION_EVENTS.has(eventType)) {
    updates.planStatus = "active";
    const dueDate = getDueDate(payload);
    if (dueDate) updates.planExpiry = dueDate;
  } else if (PAST_DUE_EVENTS.has(eventType)) {
    updates.planStatus = "past_due";
  } else if (CANCELED_EVENTS.has(eventType)) {
    updates.planStatus = "canceled";
  }

  if (Object.keys(updates).length > 0) {
    await db.updateUserById(linked.user.id, updates);
  }

  await db.createProcessedWebhookEvent({
    provider: "asaas",
    eventId,
    eventType,
  });

  return { ok: true, ignored: false, eventType, eventId } as const;
}

