import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { FcmToken } from "@/models/fcm-token";
import ApiResponse from "@/lib/response";
import { getAdminMessaging } from "@/firebase/admin";

export async function GET() {
  if (process.env.NODE_ENV === "production") return ApiResponse.notFound("Not found");
  await connectDB();
  const tokens = await FcmToken.find().lean();
  return ApiResponse.ok({ count: tokens.length, tokens });
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") return ApiResponse.notFound("Not found");

  const { token } = await req.json().catch(() => ({}));
  if (!token) return ApiResponse.badRequest("token is required");

  console.log("[debug-notifications] Sending directly to token:", token.slice(0, 40));

  try {
    const messaging = getAdminMessaging();
    const result = await messaging.send({
      token,
      notification: {
        title: "Nouvelle commande !",
        body: "Debug Test — 42.00 € — 123 rue de la Paix",
      },
      webpush: {
        fcmOptions: { link: "/dashboard/orders" },
      },
    });
    console.log("[debug-notifications] SUCCESS:", result);
    return ApiResponse.ok({ success: true, messageId: result });
  } catch (err: any) {
    console.error("[debug-notifications] FAILED:", err);
    return ApiResponse.internalServerError(err?.message ?? "Unknown error");
  }
}
