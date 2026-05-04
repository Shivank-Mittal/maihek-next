/**
 * Manual test script — sends a real FCM push notification via Firebase Admin SDK.
 * Run with: npx tsx tests/send-notification-manual.ts
 */
import * as fs from "fs";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

const TOKEN =
  "f9fq9lzNMaBTncnpoVHX8O:APA91bHw2f7ghx8t_HpnB4UHdOHHLeuK1Cz-L4zsiBaO8CTMkdSFfbVyEfTWcv3C4AkIFFS3I3oEkG95egAcf5gEqe04WmMJcXP4IT4xTnRDxXt-WrXJjxE";

async function main() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(
      fs.readFileSync("/Users/shivankmittal/Downloads/maihak-firebase-adminsdk-fbsvc-fdf389907f.json", "utf8")
    );
    initializeApp({ credential: cert(serviceAccount) });
  }

  const messaging = getMessaging();

  console.log("Sending test notification to hardcoded token...");

  try {
    const result = await messaging.send({
      token: TOKEN,
      notification: {
        title: "Nouvelle commande !",
        body: "Test — Shivank Mittal — 42 € — 12 rue de la Paix",
      },
      webpush: {
        fcmOptions: { link: "/dashboard/orders" },
      },
    });
    console.log("SUCCESS:", result);
  } catch (err) {
    console.error("FAILED:", err);
  }
}

main();
