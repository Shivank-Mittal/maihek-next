/**
 * Unit tests for order-notification-service.ts
 *
 * All external dependencies (MongoDB, Firebase Admin) are mocked so these
 * run without any network or database access.
 */

import { sendOrderPushNotifications } from "@/services/order-notification-service";
import type { OrderPayload } from "@/lib/order-service";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockSend = jest.fn();

jest.mock("@/lib/db", () => jest.fn().mockResolvedValue(undefined));

jest.mock("@/models/fcm-token", () => ({
  FcmToken: { find: jest.fn() },
}));

jest.mock("@/firebase/admin", () => ({
  getAdminMessaging: () => ({ send: mockSend }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

import { FcmToken } from "@/models/fcm-token";

const mockFcmFind = FcmToken.find as jest.Mock;

function makePayload(overrides: Partial<OrderPayload> = {}): OrderPayload {
  return {
    customerName: "Jean Dupont",
    phone: "0612345678",
    email: "jean@test.fr",
    deliveryAddress: "",
    addressPincode: "75001",
    addressInstructions: "",
    orderType: "emporter",
    items: [{ name: "Poulet Tikka", price: 12.5, quantity: 2, _subtotal: 25.0 }],
    total: 25.0,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockSend.mockResolvedValue({ messageId: "msg-123" });
});

describe("sendOrderPushNotifications", () => {
  // ── No tokens ──────────────────────────────────────────────────────────────

  it("does nothing when no FCM tokens are registered", async () => {
    mockFcmFind.mockReturnValue({ lean: () => Promise.resolve([]) });

    await sendOrderPushNotifications(makePayload());

    expect(mockSend).not.toHaveBeenCalled();
  });

  // ── Single token ───────────────────────────────────────────────────────────

  it("sends to a single registered token", async () => {
    mockFcmFind.mockReturnValue({
      lean: () => Promise.resolve([{ token: "token-abc" }]),
    });

    await sendOrderPushNotifications(makePayload());

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ token: "token-abc" })
    );
  });

  // ── Multiple tokens ────────────────────────────────────────────────────────

  it("sends to all registered tokens in parallel", async () => {
    mockFcmFind.mockReturnValue({
      lean: () =>
        Promise.resolve([
          { token: "token-1" },
          { token: "token-2" },
          { token: "token-3" },
        ]),
    });

    await sendOrderPushNotifications(makePayload());

    expect(mockSend).toHaveBeenCalledTimes(3);
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ token: "token-1" }));
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ token: "token-2" }));
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ token: "token-3" }));
  });

  // ── Notification body ──────────────────────────────────────────────────────

  it("formats notification title and body correctly", async () => {
    mockFcmFind.mockReturnValue({
      lean: () => Promise.resolve([{ token: "token-abc" }]),
    });

    await sendOrderPushNotifications(
      makePayload({ customerName: "Marie Curie", total: 42.5, orderType: "emporter", deliveryAddress: "" })
    );

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        notification: {
          title: "Nouvelle commande !",
          body: "Marie Curie — 42.50 € — À emporter",
        },
      })
    );
  });

  it("includes delivery address in body for livraison orders", async () => {
    mockFcmFind.mockReturnValue({
      lean: () => Promise.resolve([{ token: "token-abc" }]),
    });

    await sendOrderPushNotifications(
      makePayload({
        orderType: "livraison",
        deliveryAddress: "12 Rue de la Paix, Paris",
        total: 30.0,
        customerName: "Paul Martin",
      })
    );

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        notification: expect.objectContaining({
          body: "Paul Martin — 30.00 € — 12 Rue de la Paix, Paris",
        }),
      })
    );
  });

  it("omits location part when no address and no known orderType", async () => {
    mockFcmFind.mockReturnValue({
      lean: () => Promise.resolve([{ token: "token-abc" }]),
    });

    await sendOrderPushNotifications(
      makePayload({ orderType: "", deliveryAddress: "", customerName: "Alice", total: 15.0 })
    );

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        notification: expect.objectContaining({
          body: "Alice — 15.00 €",
        }),
      })
    );
  });

  // ── Webpush deep link ──────────────────────────────────────────────────────

  it("sets the deep link to the orders dashboard", async () => {
    mockFcmFind.mockReturnValue({
      lean: () => Promise.resolve([{ token: "token-abc" }]),
    });

    await sendOrderPushNotifications(makePayload());

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        webpush: { fcmOptions: { link: "/dashboard/orders" } },
      })
    );
  });

  // ── Resilience: one bad token ──────────────────────────────────────────────

  it("still sends to valid tokens when one token is invalid", async () => {
    mockFcmFind.mockReturnValue({
      lean: () =>
        Promise.resolve([{ token: "bad-token" }, { token: "good-token" }]),
    });

    mockSend
      .mockRejectedValueOnce(new Error("registration-token-not-registered"))
      .mockResolvedValueOnce({ messageId: "msg-ok" });

    // Should not throw — allSettled absorbs individual failures
    await expect(sendOrderPushNotifications(makePayload())).resolves.toBeUndefined();

    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("resolves successfully even if all tokens fail", async () => {
    mockFcmFind.mockReturnValue({
      lean: () =>
        Promise.resolve([{ token: "token-1" }, { token: "token-2" }]),
    });

    mockSend.mockRejectedValue(new Error("messaging/invalid-registration-token"));

    await expect(sendOrderPushNotifications(makePayload())).resolves.toBeUndefined();
  });

  // ── DB failure ─────────────────────────────────────────────────────────────

  it("throws when the database connection fails", async () => {
    const connectDB = require("@/lib/db");
    connectDB.mockRejectedValueOnce(new Error("DB connection refused"));

    await expect(sendOrderPushNotifications(makePayload())).rejects.toThrow(
      "DB connection refused"
    );
  });
});
