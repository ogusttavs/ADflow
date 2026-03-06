import { beforeEach, describe, expect, it, vi } from "vitest";
import { processKiwifyWebhookPayload } from "./_core/kiwifyWebhook";

const dbMock = vi.hoisted(() => ({
  getProcessedWebhookEventByEventId: vi.fn(),
  createProcessedWebhookEvent: vi.fn(),
  getUserByAsaasSubscriptionId: vi.fn(),
  getUserByAsaasCustomerId: vi.fn(),
  getUserByEmail: vi.fn(),
  updateUserById: vi.fn(),
}));

vi.mock("./db", () => dbMock);

describe("processKiwifyWebhookPayload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getProcessedWebhookEventByEventId.mockResolvedValue(undefined);
    dbMock.createProcessedWebhookEvent.mockResolvedValue(1);
    dbMock.getUserByAsaasSubscriptionId.mockResolvedValue(undefined);
    dbMock.getUserByAsaasCustomerId.mockResolvedValue(undefined);
    dbMock.getUserByEmail.mockResolvedValue(undefined);
    dbMock.updateUserById.mockResolvedValue(undefined);
  });

  it("ignores duplicate events", async () => {
    dbMock.getProcessedWebhookEventByEventId.mockResolvedValue({
      id: 12,
      provider: "kiwify",
      eventId: "evt_dup",
      eventType: "ORDER_APPROVED",
      processedAt: new Date(),
      createdAt: new Date(),
    });

    const result = await processKiwifyWebhookPayload({
      id: "evt_dup",
      event: "order_approved",
    });

    expect(result.ok).toBe(true);
    expect(result.ignored).toBe(true);
    expect(result.reason).toBe("already_processed");
    expect(dbMock.updateUserById).not.toHaveBeenCalled();
  });

  it("activates plan when approved event is received", async () => {
    dbMock.getUserByEmail.mockResolvedValue({
      id: 7,
      openId: "local_7",
      plan: null,
    });

    const result = await processKiwifyWebhookPayload({
      id: "evt_ok",
      event: "order_approved",
      customer: {
        email: "user@orbita.app",
      },
      plan: "business_pro",
      subscription_id: "sub_kiwify_123",
      customer_id: "cus_kiwify_123",
      next_payment_date: "2026-04-05",
    });

    expect(result.ok).toBe(true);
    expect(result.ignored).toBe(false);
    expect(dbMock.updateUserById).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        plan: "business_pro",
        planStatus: "active",
        asaasSubscriptionId: "sub_kiwify_123",
        asaasCustomerId: "cus_kiwify_123",
      }),
    );
    expect(dbMock.createProcessedWebhookEvent).toHaveBeenCalledWith({
      provider: "kiwify",
      eventId: "evt_ok",
      eventType: "ORDER_APPROVED",
    });
  });

  it("marks plan as canceled on refund events", async () => {
    dbMock.getUserByEmail.mockResolvedValue({
      id: 8,
      openId: "local_8",
      plan: "business_standard",
    });

    await processKiwifyWebhookPayload({
      id: "evt_cancel",
      event: "payment_refunded",
      customer_email: "user@orbita.app",
    });

    expect(dbMock.updateUserById).toHaveBeenCalledWith(
      8,
      expect.objectContaining({
        planStatus: "canceled",
      }),
    );
  });
});
