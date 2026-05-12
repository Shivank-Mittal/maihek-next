import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { FcmToken } from "@/models/fcm-token";
import ApiResponse from "@/lib/response";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "admin") {
    return ApiResponse.unauthorized("Not authorized");
  }

  const { token, checkOnly } = await req.json();
  if (!token) return ApiResponse.badRequest("Missing FCM token");

  await connectDB();

  if (checkOnly) {
    const exists = await FcmToken.exists({ token });
    return ApiResponse.ok({ subscribed: !!exists });
  }

  await FcmToken.findOneAndUpdate({ token }, { token }, { upsert: true, new: true });
  return ApiResponse.ok({ message: "Subscribed" });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "admin") {
    return ApiResponse.unauthorized("Not authorized");
  }

  const { token } = await req.json();
  await connectDB();
  await FcmToken.deleteOne({ token });
  return ApiResponse.ok({ message: "Unsubscribed" });
}
