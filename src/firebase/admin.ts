import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getMessaging, Messaging } from "firebase-admin/messaging";

function getAdminMessaging(): Messaging {
  if (!getApps().length) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
    console.log("[firebase-admin] Initializing with project:", projectId);
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }
  return getMessaging();
}

export { getAdminMessaging };
