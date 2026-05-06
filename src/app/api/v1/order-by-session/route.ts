import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { Order } from "@/models/order";
import ApiResponse from "@/lib/response";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) return ApiResponse.badRequest("Missing session_id");

  await connectDB();
  const order = await Order.findOne({ stripeSessionId: sessionId }).lean();
  if (!order) return ApiResponse.notFound("Order not found");

  return ApiResponse.ok(order);
}
