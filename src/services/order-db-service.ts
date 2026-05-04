import connectDB from "@/lib/db";
import { Order } from "@/models/order";
import type { OrderPayload } from "@/lib/order-service";

export async function saveOrder(payload: OrderPayload): Promise<void> {
  await connectDB();
  await Order.create({
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
  });
}
