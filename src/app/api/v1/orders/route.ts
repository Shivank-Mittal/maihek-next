import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Order } from "@/models/order";
import ApiResponse from "@/lib/response";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "admin") {
    return ApiResponse.unauthorized("Not authorized");
  }

  await connectDB();
  const orders = await Order.find().sort({ createdAt: -1 }).lean();
  return ApiResponse.ok(orders);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "admin") {
    return ApiResponse.unauthorized("Not authorized");
  }

  const { id, status } = await req.json();
  const validStatuses = ["pending", "confirmed", "completed"];
  if (!id || !validStatuses.includes(status)) {
    return ApiResponse.badRequest("Invalid id or status");
  }

  await connectDB();
  const updated = await Order.findByIdAndUpdate(id, { status }, { new: true });
  if (!updated) return ApiResponse.notFound("Order not found");
  return ApiResponse.ok(updated);
}
