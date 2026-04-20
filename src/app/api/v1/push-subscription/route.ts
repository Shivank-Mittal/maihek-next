import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { PushSubscription } from "@/models/push-subscription";
import ApiResponse from "@/lib/response";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "admin") {
    return ApiResponse.unauthorized("Not authorized");
  }

  const { endpoint, keys } = await req.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return ApiResponse.badRequest("Invalid subscription");
  }

  await connectDB();
  await PushSubscription.findOneAndUpdate(
    { endpoint },
    { endpoint, keys },
    { upsert: true, new: true }
  );

  return ApiResponse.ok({ message: "Subscribed" });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "admin") {
    return ApiResponse.unauthorized("Not authorized");
  }

  const { endpoint } = await req.json();
  await connectDB();
  await PushSubscription.deleteOne({ endpoint });
  return ApiResponse.ok({ message: "Unsubscribed" });
}
