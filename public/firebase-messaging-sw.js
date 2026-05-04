importScripts("https://www.gstatic.com/firebasejs/12.12.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.12.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAhw4KtNEBWed4CVcflu9F_Z8Hg31l9XTw",
  authDomain: "maihak.firebaseapp.com",
  projectId: "maihak",
  storageBucket: "maihak.firebasestorage.app",
  messagingSenderId: "834752351653",
  appId: "1:834752351653:web:4e0555580f04d682016c4c",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "Nouvelle commande !";
  const body = payload.notification?.body ?? "";
  self.registration.showNotification(title, {
    body,
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/dashboard/orders") && "focus" in client) {
          client.postMessage({ type: "NOTIFICATION_CLICK" });
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow("/dashboard/orders");
    })
  );
});
