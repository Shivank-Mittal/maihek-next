import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Order } from "@/models/order";
import ApiResponse from "@/lib/response";
import jwt from "jsonwebtoken";

function isAuthorized(req: NextRequest, session: any) {
  if (session?.user?.role === "admin") return true;
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET as string) as any;
    return payload?.role === "admin";
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAuthorized(req, session)) {
    return ApiResponse.unauthorized("Not authorized");
  }

  await connectDB();
  const orders = await Order.find().sort({ createdAt: -1 }).lean();
  return ApiResponse.ok(orders);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAuthorized(req, session)) {
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
