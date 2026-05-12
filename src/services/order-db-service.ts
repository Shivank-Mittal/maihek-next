import connectDB from "@/lib/db";
import { Order } from "@/models/order";
import type { OrderPayload } from "@/lib/order-service";

export async function saveOrder(payload: OrderPayload): Promise<void> {
  await connectDB();

  const doc = {
    customerName: payload.customerName,
    phone: payload.phone,
    email: payload.email,
    deliveryAddress: payload.deliveryAddress,
    addressPincode: payload.addressPincode,
    addressInstructions: payload.addressInstructions,
    orderType: payload.orderType,
    items: payload.items,
    total: payload.total,
    status: "pending",
    stripeSessionId: payload.stripeSessionId ?? "",
    paymentMethod: payload.paymentMethod ?? "",
  };

  if (payload.stripeSessionId) {
    // Idempotent upsert — Stripe may retry the webhook; $setOnInsert ensures
    // we never overwrite an order that already exists for this session.
    const result = await Order.findOneAndUpdate(
      { stripeSessionId: payload.stripeSessionId },
      { $setOnInsert: doc },
      { upsert: true, new: false }
    );
    if (result !== null) {
      // Document already existed — this was a duplicate webhook delivery.
      return;
    }
  } else {
    await Order.create(doc);
  }
}
