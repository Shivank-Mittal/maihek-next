"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Printer, Bell, BellOff } from "lucide-react";
import { getToken, onMessage } from "firebase/messaging";
import { firebaseMessaging } from "@/firebase/initialize";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  _subtotal: number;
  option?: string;
}

interface Order {
  _id: string;
  customerName: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  addressPincode: string;
  addressInstructions: string;
  orderType: "livraison" | "emporter" | "";
  items: OrderItem[];
  total: number;
  status: "pending" | "confirmed" | "completed";
  paymentMethod: string;
  stripeSessionId?: string;
  createdAt: string;
}


const statusConfig = {
  pending: {
    label: "En attente",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    next: "confirmed" as const,
    nextLabel: "Confirmer",
  },
  confirmed: {
    label: "Confirmée",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    next: "completed" as const,
    nextLabel: "Terminer",
  },
  completed: {
    label: "Terminée",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    next: null,
    nextLabel: null,
  },
};

let audioCtx: AudioContext | null = null;

const unlockAudio = () => {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
};

const playBeep = async () => {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") await audioCtx.resume();

  const ctx = audioCtx;
  const beep = (startTime: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.value = 960;
    gain.gain.setValueAtTime(0.6, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
    osc.start(startTime);
    osc.stop(startTime + 0.25);
  };

  beep(ctx.currentTime);
  beep(ctx.currentTime + 0.35);
  beep(ctx.currentTime + 0.7);
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const lastCountRef = useRef<number | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/orders");
      const json = await res.json();
      if (!json.success) return;
      const incoming: Order[] = json.data;
      const prevCount = lastCountRef.current;
      const hasNewOrders = prevCount !== null && incoming.length > prevCount;
      if (hasNewOrders) playBeep();
      lastCountRef.current = incoming.length;
      setOrders(incoming);
      if (hasNewOrders) setPage(1);
    } catch {
      // silently fail on poll errors
    }
  }, []);

  useEffect(() => {
    fetchOrders().finally(() => setLoading(false));
    const id = setInterval(fetchOrders, 10_000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  const fcmTokenRef = useRef<string | null>(null);
  const swRegRef = useRef<ServiceWorkerRegistration | null>(null);

  const getSwReg = () => {
    if (swRegRef.current) return Promise.resolve(swRegRef.current);
    return navigator.serviceWorker.register("/firebase-messaging-sw.js").then((reg) => {
      swRegRef.current = reg;
      return reg;
    });
  };

  // Check if already subscribed on mount
  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    getSwReg().then(async (reg) => {
      const token = await getToken(firebaseMessaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: reg,
      }).catch(() => null);
      if (token) {
        fcmTokenRef.current = token;
        setPushSubscribed(true);
      }
    });
  }, []);

  // Handle foreground messages
  useEffect(() => {
    const unsub = onMessage(firebaseMessaging, (payload) => {
      const title = payload.notification?.title ?? "Nouvelle commande !";
      const body = payload.notification?.body ?? "";
      playBeep();
      const reg = swRegRef.current;
      if (reg) {
        reg.showNotification(title, { body, requireInteraction: true });
      } else {
        new Notification(title, { body, requireInteraction: true });
      }
    });
    return unsub;
  }, []);

  // Play beep when a background notification is clicked and tab is focused
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "NOTIFICATION_CLICK") playBeep();
    };
    navigator.serviceWorker?.addEventListener("message", handler);
    return () => navigator.serviceWorker?.removeEventListener("message", handler);
  }, []);

  const handlePushToggle = async () => {
    unlockAudio();
    if (!("Notification" in window)) {
      alert("Les notifications ne sont pas supportées sur ce navigateur.");
      return;
    }
    setPushLoading(true);
    try {
      if (pushSubscribed && fcmTokenRef.current) {
        await fetch("/api/v1/push-subscription", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: fcmTokenRef.current }),
        });
        fcmTokenRef.current = null;
        setPushSubscribed(false);
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          alert("Permission refusée. Activez les notifications dans les paramètres.");
          return;
        }
        const reg = await getSwReg();
        const token = await getToken(firebaseMessaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: reg,
        });
        console.log("Susbscribed with the token, ", token )
        await fetch("/api/v1/push-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        fcmTokenRef.current = token;
        setPushSubscribed(true);
      }
    } catch (err) {
      console.error("Push toggle error:", err);
    } finally {
      setPushLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: Order["status"]) => {
    setOrders((prev) =>
      prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
    );
    await fetch("/api/v1/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: orderId, status: newStatus }),
    });
  };

  const handlePrint = (order: Order) => {
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
      window.onafterprint = () => setPrintingOrder(null);
    }, 50);
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const pagedOrders = useMemo(
    () => orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [orders, page, PAGE_SIZE]
  );

  const itemsSummary = (items: OrderItem[]) => {
    if (items.length === 0) return "-";
    const first = `${items[0].quantity}x ${items[0].name}`;
    return items.length > 1 ? `${first} +${items.length - 1}` : first;
  };

  return (
    <>
      {/* Print receipt — visible only during print */}
      {printingOrder && (
        <div className="hidden print:block p-8 font-sans text-black">
          <h1 className="text-2xl font-bold mb-1">Maihak — Commande</h1>
          <p className="text-sm text-gray-500 mb-4">{formatTime(printingOrder.createdAt)}</p>
          <p>
            <strong>Client:</strong> {printingOrder.customerName}
          </p>
          <p>
            <strong>Téléphone:</strong> {printingOrder.phone || "-"}
          </p>
          <p>
            <strong>Type:</strong>{" "}
            {printingOrder.orderType === "livraison" ? "Livraison" : "À emporter"}
          </p>
          <p>
            <strong>Paiement:</strong>{" "}
            {printingOrder.paymentMethod === "online"
              ? "En ligne (Stripe)"
              : printingOrder.paymentMethod === "cod_card"
                ? "Carte (à la livraison)"
                : "Espèces (à la livraison)"}
          </p>
          {printingOrder.orderType === "livraison" && printingOrder.deliveryAddress && (
            <p>
              <strong>Adresse:</strong> {printingOrder.deliveryAddress}{" "}
              {printingOrder.addressPincode}
            </p>
          )}
          {printingOrder.addressInstructions && (
            <p>
              <strong>Instructions:</strong> {printingOrder.addressInstructions}
            </p>
          )}
          <hr className="my-4" />
          <ul className="space-y-1">
            {printingOrder.items.map((item, i) => (
              <li key={i} className="flex justify-between">
                <span>
                  {item.quantity}x {item.name}
                  {item.option ? ` (${item.option})` : ""}
                </span>
                <span>{item._subtotal.toFixed(2)} €</span>
              </li>
            ))}
          </ul>
          <hr className="my-4" />
          <p className="text-xl font-bold text-right">Total: {printingOrder.total.toFixed(2)} €</p>
        </div>
      )}

      {/* Main page — hidden during print */}
      <div className="print:hidden min-h-screen flex flex-col items-center bg-gray-100 p-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 rounded-xl shadow-lg w-full"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <h1 className="text-3xl font-bold text-gray-800">Commandes</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Mise à jour toutes les 10 s</span>
              <Button
                variant={pushSubscribed ? "default" : "outline"}
                size="sm"
                onClick={handlePushToggle}
                disabled={pushLoading}
              >
                {pushSubscribed ? (
                  <>
                    <Bell className="h-4 w-4 mr-1" />
                    Notifications activées
                  </>
                ) : (
                  <>
                    <BellOff className="h-4 w-4 mr-1" />
                    Activer les notifications
                  </>
                )}
              </Button>
            </div>
          </div>

          {loading ? (
            <p className="text-gray-600 text-center">Chargement...</p>
          ) : orders.length === 0 ? (
            <p className="text-gray-600 text-center">Aucune commande pour le moment.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Heure</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Paiement</TableHead>
                    <TableHead>Articles</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead>Stripe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedOrders.map((order) => {
                    const cfg = statusConfig[order.status];
                    return (
                      <TableRow key={order._id}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatTime(order.createdAt)}
                        </TableCell>
                        <TableCell className="font-medium">{order.customerName}</TableCell>
                        <TableCell>{order.phone || "-"}</TableCell>
                        <TableCell>
                          {order.orderType === "livraison" ? (
                            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                              Livraison
                            </Badge>
                          ) : order.orderType === "emporter" ? (
                            <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700">
                              À emporter
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {order.paymentMethod === "online"
                            ? "En ligne"
                            : order.paymentMethod === "cod_card"
                              ? "Carte (livraison)"
                              : order.paymentMethod === "cod_cash"
                                ? "Espèces (livraison)"
                                : "-"}
                        </TableCell>
                        <TableCell className="max-w-48 truncate text-sm">
                          {itemsSummary(order.items)}
                        </TableCell>
                        <TableCell className="font-medium">{order.total.toFixed(2)} €</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cfg.className}>
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {cfg.next && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(order._id, cfg.next!)}
                              >
                                {cfg.nextLabel}
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="secondary"
                              onClick={() => handlePrint(order)}
                              aria-label="Imprimer"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.stripeSessionId ? (
                            <a
                              href={`https://dashboard.stripe.com/payments/${order.stripeSessionId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" variant="outline" className="font-mono text-xs">
                                {order.stripeSessionId.slice(-8)}…
                              </Button>
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, orders.length)} sur {orders.length} commandes
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      aria-label="Page précédente"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-3 font-medium text-foreground">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      aria-label="Page suivante"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}
