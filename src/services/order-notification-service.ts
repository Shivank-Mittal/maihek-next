import connectDB from "@/lib/db";
import { FcmToken } from "@/models/fcm-token";
import { getAdminMessaging } from "@/firebase/admin";
import type { OrderPayload } from "@/lib/order-service";

export async function sendOrderPushNotifications(payload: OrderPayload): Promise<void> {
  await connectDB();
  const tokens = await FcmToken.find().lean();
  if (tokens.length === 0) return;

  const locationPart = payload.deliveryAddress
    ? ` — ${payload.deliveryAddress}`
    : payload.orderType === "emporter"
      ? " — À emporter"
      : "";

  const messaging = getAdminMessaging();
  const results = await Promise.allSettled(
    tokens.map((t) =>
      messaging.send({
        token: t.token,
        notification: {
          title: "Nouvelle commande !",
          body: `${payload.customerName} — ${payload.total.toFixed(2)} €${locationPart}`,
        },
        webpush: {
          fcmOptions: { link: "/dashboard/orders" },
        },
      })
    )
  );

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      console.log(`[notification] Token[${i}] sent OK:`, result.value);
    } else {
      console.error(`[notification] Token[${i}] FAILED:`, result.reason);
    }
  });
}
