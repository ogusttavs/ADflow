import { beforeEach, describe, expect, it, vi } from "vitest";
import { processAsaasWebhookPayload } from "./_core/asaasWebhook";

const dbMock = vi.hoisted(() => ({
  getProcessedWebhookEventByEventId: vi.fn(),
  createProcessedWebhookEvent: vi.fn(),
  getUserByAsaasSubscriptionId: vi.fn(),
  getUserByAsaasCustomerId: vi.fn(),
  updateUserById: vi.fn(),
}));

vi.mock("./db", () => dbMock);

describe("processAsaasWebhookPayload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getProcessedWebhookEventByEventId.mockResolvedValue(undefined);
    dbMock.createProcessedWebhookEvent.mockResolvedValue(1);
    dbMock.getUserByAsaasSubscriptionId.mockResolvedValue(undefined);
    dbMock.getUserByAsaasCustomerId.mockResolvedValue(undefined);
    dbMock.updateUserById.mockResolvedValue(undefined);
  });

  it("ignores duplicate events", async () => {
    dbMock.getProcessedWebhookEventByEventId.mockResolvedValue({
      id: 10,
      provider: "asaas",
      eventId: "evt_1",
      eventType: "PAYMENT_RECEIVED",
      processedAt: new Date(),
      createdAt: new Date(),
    });

    const result = await processAsaasWebhookPayload({
      id: "evt_1",
      event: "PAYMENT_RECEIVED",
    });

    expect(result.ok).toBe(true);
    expect(result.ignored).toBe(true);
    expect(result.reason).toBe("already_processed");
    expect(dbMock.updateUserById).not.toHaveBeenCalled();
  });

  it("activates plan on PAYMENT_RECEIVED and records event", async () => {
    dbMock.getUserByAsaasSubscriptionId.mockResolvedValue({
      id: 7,
      openId: "local_7",
    });

    const result = await processAsaasWebhookPayload({
      id: "evt_2",
      event: "PAYMENT_RECEIVED",
      payment: {
        id: "pay_1",
        subscription: "sub_123",
        customer: "cus_123",
        dueDate: "2026-03-25",
      },
    });

    expect(result.ok).toBe(true);
    expect(result.ignored).toBe(false);
    expect(dbMock.updateUserById).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        asaasSubscriptionId: "sub_123",
        planStatus: "active",
      }),
    );
    expect(dbMock.createProcessedWebhookEvent).toHaveBeenCalledWith({
      provider: "asaas",
      eventId: "evt_2",
      eventType: "PAYMENT_RECEIVED",
    });
  });

  it("marks plan as past_due on PAYMENT_OVERDUE", async () => {
    dbMock.getUserByAsaasCustomerId.mockResolvedValue({
      id: 8,
      openId: "local_8",
    });

    await processAsaasWebhookPayload({
      id: "evt_3",
      event: "PAYMENT_OVERDUE",
      payment: {
        id: "pay_2",
        customer: "cus_456",
      },
    });

    expect(dbMock.updateUserById).toHaveBeenCalledWith(
      8,
      expect.objectContaining({
        asaasCustomerId: "cus_456",
        planStatus: "past_due",
      }),
    );
  });
});

