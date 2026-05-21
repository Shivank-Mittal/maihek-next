import { saveOrder } from "@/services/order-db-service";
import { sendOrderPushNotifications } from "@/services/order-notification-service";
import { sendOrderEmail } from "@/services/order-email-service";

export interface OrderItemAddon {
  name: string;
  price: number;
  quantity: number;
}

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  _subtotal: number;
  addons?: OrderItemAddon[];
}

export interface OrderPayload {
  customerName: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  addressPincode: string;
  addressInstructions: string;
  orderType: "livraison" | "emporter" | "";
  items: OrderItem[];
  total: number;
  stripeSessionId?: string;
  paymentMethod?: string;
}

/**
 * Orchestrates all three side effects for a completed order.
 * Each step is independent — a failure in one does not prevent the others.
 */
export async function fulfillOrder(payload: OrderPayload, paymentLabel: string): Promise<void> {
  const results = await Promise.allSettled([
    saveOrder(payload),
    sendOrderPushNotifications(payload),
    sendOrderEmail(payload, paymentLabel),
  ]);

  const labels = ["DB save", "Push notification", "Email"] as const;
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "rejected") {
      console.error(`[order-service] ${labels[i]} failed:`, result.reason);
    }
  }
}
