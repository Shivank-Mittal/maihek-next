import * as fs from "fs";
import * as path from "path";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getMessaging, Messaging } from "firebase-admin/messaging";

function getAdminMessaging(): Messaging {
  if (!getApps().length) {
    const serviceAccountPath = path.resolve(process.cwd(), "src/firebase/service-account.json");
    console.log("[firebase-admin] Loading service account from:", serviceAccountPath);
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    initializeApp({ credential: cert(serviceAccount) });
    console.log("[firebase-admin] Initialized with project:", serviceAccount.project_id);
  }
  return getMessaging();
}

export { getAdminMessaging };
