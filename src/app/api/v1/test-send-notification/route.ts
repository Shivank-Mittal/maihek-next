/**
 * Test-only endpoint — disabled in production.
 * Allows E2E tests to trigger a real push notification without placing a full order.
 *
 * POST /api/v1/test-send-notification
 * Header: Authorization: Bearer <jwt>
 * Body: { customerName, total, orderType, deliveryAddress? }
 */
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import ApiResponse from "@/lib/response";
import { sendOrderPushNotifications } from "@/services/order-notification-service";
import type { OrderPayload } from "@/lib/order-service";

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return ApiResponse.notFound("Not found");
  }

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return ApiResponse.unauthorized("Missing token");
  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET as string) as any;
    if (payload?.role !== "admin") return ApiResponse.unauthorized("Not authorized");
  } catch {
    return ApiResponse.unauthorized("Invalid token");
  }

  const body = await req.json();
  const { customerName, total, orderType, deliveryAddress } = body;

  if (!customerName || total == null) {
    return ApiResponse.badRequest("customerName and total are required");
  }

  const payload: OrderPayload = {
    customerName,
    phone: "",
    email: "",
    deliveryAddress: deliveryAddress ?? "",
    addressPincode: "",
    addressInstructions: "",
    orderType: orderType ?? "",
    items: [],
    total,
  };

  await sendOrderPushNotifications(payload);

  return ApiResponse.ok({ message: "Notification sent" });
}
