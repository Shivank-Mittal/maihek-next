"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { getToken, onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "@/firebase/initialize";
import {
  IconBell,
  IconBellOff,
  IconPrinter,
  IconFileDescription,
  IconChevronLeft,
  IconChevronRight,
  IconShoppingBag,
  IconTruck,
  IconCreditCard,
  IconCash,
  IconWorld,
  IconMapPin,
  IconPhone,
  IconMail,
  IconCalendar,
  IconReceipt,
  IconExternalLink,
  IconCheck,
  IconRotateClockwise,
} from "@tabler/icons-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OrderItemAddon {
  name: string;
  price: number;
  quantity: number;
}

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  _subtotal: number;
  addons?: OrderItemAddon[];
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

function paymentLabel(method: string) {
  if (method === "online") return { label: "En ligne", Icon: IconWorld };
  if (method === "cod_card") return { label: "Carte", Icon: IconCreditCard };
  if (method === "cod_cash") return { label: "Espèces", Icon: IconCash };
  return { label: "-", Icon: IconReceipt };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
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

  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const messaging = getFirebaseMessaging();
    if (!messaging) return;
    getSwReg().then(async (reg) => {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: reg,
      }).catch(() => null);
      if (!token) return;
      // Verify this token is actually registered in the DB
      const res = await fetch("/api/v1/push-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, checkOnly: true }),
      }).catch(() => null);
      const json = res ? await res.json().catch(() => null) : null;
      if (json?.data?.subscribed) {
        fcmTokenRef.current = token;
        setPushSubscribed(true);
      }
    });
  }, []);

  useEffect(() => {
    const messaging = getFirebaseMessaging();
    if (!messaging) return;
    const unsub = onMessage(messaging, (payload) => {
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
        const messaging = getFirebaseMessaging();
        if (!messaging) throw new Error("Firebase Messaging not available");
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: reg,
        });
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

  const handlePrint = (order: Order) => {
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
      window.onafterprint = () => setPrintingOrder(null);
    }, 50);
  };

  const updateStatus = async (order: Order, newStatus: "pending" | "completed") => {
    setUpdatingStatus(order._id);
    try {
      const res = await fetch("/api/v1/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order._id, status: newStatus }),
      });
      const json = await res.json();
      if (!json.success) return;
      setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, status: newStatus } : o)));
      if (detailOrder?._id === order._id) setDetailOrder((d) => d ? { ...d, status: newStatus } : d);
    } catch {
      // silently fail
    } finally {
      setUpdatingStatus(null);
    }
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

  return (
    <>
      {/* Print receipt */}
      {printingOrder && (
        <div className="hidden print:block p-8 font-sans text-black">
          <h1 className="text-2xl font-bold mb-1">Maihak — Commande</h1>
          <p className="text-sm text-gray-500 mb-4">{formatTime(printingOrder.createdAt)}</p>
          <p><strong>Client:</strong> {printingOrder.customerName}</p>
          <p><strong>Téléphone:</strong> {printingOrder.phone || "-"}</p>
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
            <p><strong>Instructions:</strong> {printingOrder.addressInstructions}</p>
          )}
          <hr className="my-4" />
          <ul className="space-y-1">
            {printingOrder.items.map((item, i) => (
              <li key={i} className="space-y-0.5">
                <div className="flex justify-between">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{item._subtotal.toFixed(2)} €</span>
                </div>
                {item.addons?.map((a, j) => (
                  <div key={j} className="flex justify-between text-gray-500 pl-4 text-sm">
                    <span>+ {a.quantity}x {a.name}</span>
                    <span>{(a.price * a.quantity).toFixed(2)} €</span>
                  </div>
                ))}
              </li>
            ))}
          </ul>
          <hr className="my-4" />
          <p className="text-xl font-bold text-right">Total: {printingOrder.total.toFixed(2)} €</p>
        </div>
      )}

      {/* Main page */}
      <div className="print:hidden min-h-screen bg-gray-50 p-6">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-6xl mx-auto space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Commandes</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {orders.length} commande{orders.length !== 1 ? "s" : ""} · mise à jour toutes les 10 s
              </p>
            </div>
            <Button
              variant={pushSubscribed ? "default" : "outline"}
              size="sm"
              onClick={handlePushToggle}
              disabled={pushLoading}
              className="gap-2"
            >
              {pushSubscribed ? (
                <>
                  <IconBell size={16} />
                  Notifications activées
                </>
              ) : (
                <>
                  <IconBellOff size={16} />
                  Activer les notifications
                </>
              )}
            </Button>
          </div>

          {/* Table card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 text-center text-muted-foreground text-sm">Chargement…</div>
            ) : orders.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground text-sm">
                Aucune commande pour le moment.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">Heure</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">Client</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">Téléphone</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">Type</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">Paiement</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500 text-right">Total</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">Statut</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedOrders.map((order) => {
                      const { label: pmLabel, Icon: PmIcon } = paymentLabel(order.paymentMethod);
                      return (
                        <TableRow
                          key={order._id}
                          className="group hover:bg-gray-50 transition-colors"
                        >
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatTime(order.createdAt)}
                          </TableCell>
                          <TableCell className="font-medium text-gray-900">
                            {order.customerName}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {order.phone || <span className="text-gray-300">—</span>}
                          </TableCell>
                          <TableCell>
                            {order.orderType === "livraison" ? (
                              <Badge variant="outline" className="gap-1.5 border-blue-200 bg-blue-50 text-blue-700 font-medium">
                                <IconTruck size={12} />
                                Livraison
                              </Badge>
                            ) : order.orderType === "emporter" ? (
                              <Badge variant="outline" className="gap-1.5 border-violet-200 bg-violet-50 text-violet-700 font-medium">
                                <IconShoppingBag size={12} />
                                À emporter
                              </Badge>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                              <PmIcon size={14} className="text-gray-400" />
                              {pmLabel}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-gray-900">
                            {order.total.toFixed(2)} €
                          </TableCell>
                          <TableCell>
                            {order.status === "completed" ? (
                              <Badge className="gap-1.5 bg-green-100 text-green-700 border-green-200 hover:bg-green-100" variant="outline">
                                <IconCheck size={11} />
                                Terminée
                              </Badge>
                            ) : (
                              <Badge className="gap-1.5 bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100" variant="outline">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                En attente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                                onClick={() => setDetailOrder(order)}
                                aria-label="Détails"
                              >
                                <IconFileDescription size={16} />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className={`h-8 w-8 hover:bg-gray-100 ${order.status === "completed" ? "text-green-500 hover:text-amber-600" : "text-gray-400 hover:text-green-600"}`}
                                onClick={() => updateStatus(order, order.status === "completed" ? "pending" : "completed")}
                                disabled={updatingStatus === order._id}
                                aria-label={order.status === "completed" ? "Marquer en attente" : "Marquer terminée"}
                              >
                                {order.status === "completed" ? <IconRotateClockwise size={16} /> : <IconCheck size={16} />}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                                onClick={() => handlePrint(order)}
                                aria-label="Imprimer"
                              >
                                <IconPrinter size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-muted-foreground">
                    <span>
                      {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, orders.length)} sur {orders.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        aria-label="Page précédente"
                      >
                        <IconChevronLeft size={16} />
                      </Button>
                      <span className="px-2 font-medium text-foreground">{page} / {totalPages}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        aria-label="Page suivante"
                      >
                        <IconChevronRight size={16} />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Order detail dialog */}
      <Dialog open={!!detailOrder} onOpenChange={(open) => !open && setDetailOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Détails de la commande</DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-5 text-sm">

              {/* Customer info */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Client</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-gray-700">
                    <IconCalendar size={14} className="text-gray-400 shrink-0" />
                    {formatTime(detailOrder.createdAt)}
                  </div>
                  <div className="flex items-center gap-2 font-medium text-gray-900">
                    <div className="w-3.5 shrink-0" />
                    {detailOrder.customerName}
                  </div>
                  {detailOrder.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <IconPhone size={14} className="text-gray-400 shrink-0" />
                      {detailOrder.phone}
                    </div>
                  )}
                  {detailOrder.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <IconMail size={14} className="text-gray-400 shrink-0" />
                      {detailOrder.email}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Order info */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Commande</p>
                <div className="flex items-center gap-3">
                  {detailOrder.orderType === "livraison" ? (
                    <Badge variant="outline" className="gap-1.5 border-blue-200 bg-blue-50 text-blue-700">
                      <IconTruck size={12} /> Livraison
                    </Badge>
                  ) : detailOrder.orderType === "emporter" ? (
                    <Badge variant="outline" className="gap-1.5 border-violet-200 bg-violet-50 text-violet-700">
                      <IconShoppingBag size={12} /> À emporter
                    </Badge>
                  ) : null}
                  {(() => {
                    const { label, Icon } = paymentLabel(detailOrder.paymentMethod);
                    return (
                      <span className="inline-flex items-center gap-1.5 text-gray-600">
                        <Icon size={14} className="text-gray-400" />
                        {label}
                      </span>
                    );
                  })()}
                </div>
                {detailOrder.deliveryAddress && (
                  <div className="flex items-start gap-2 text-gray-600 mt-1">
                    <IconMapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                    <span>{detailOrder.deliveryAddress}{detailOrder.addressPincode ? `, ${detailOrder.addressPincode}` : ""}</span>
                  </div>
                )}
                {detailOrder.addressInstructions && (
                  <p className="text-gray-500 italic pl-5">{detailOrder.addressInstructions}</p>
                )}
              </div>

              <div className="border-t border-gray-100" />

              {/* Articles */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Articles</p>
                <ul className="space-y-1.5">
                  {detailOrder.items.map((item, i) => (
                    <li key={i} className="space-y-0.5 text-gray-700">
                      <div className="flex justify-between">
                        <span>
                          <span className="font-medium">{item.quantity}×</span>{" "}
                          {item.name}
                        </span>
                        <span className="font-medium tabular-nums">{item._subtotal.toFixed(2)} €</span>
                      </div>
                      {item.addons?.map((a, j) => (
                        <div key={j} className="flex justify-between text-gray-400 pl-4 text-sm">
                          <span>+ {a.quantity}× {a.name}</span>
                          <span className="tabular-nums">{(a.price * a.quantity).toFixed(2)} €</span>
                        </div>
                      ))}
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-2 mt-2">
                  <span>Total</span>
                  <span className="tabular-nums">{detailOrder.total.toFixed(2)} €</span>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Statut</p>
                  {detailOrder.status === "completed" ? (
                    <Badge className="gap-1.5 bg-green-100 text-green-700 border-green-200 hover:bg-green-100" variant="outline">
                      <IconCheck size={11} />
                      Terminée
                    </Badge>
                  ) : (
                    <Badge className="gap-1.5 bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100" variant="outline">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      En attente
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className={`gap-1.5 ${detailOrder.status === "completed" ? "text-amber-600 border-amber-200 hover:bg-amber-50" : "text-green-600 border-green-200 hover:bg-green-50"}`}
                  onClick={() => updateStatus(detailOrder, detailOrder.status === "completed" ? "pending" : "completed")}
                  disabled={updatingStatus === detailOrder._id}
                >
                  {detailOrder.status === "completed" ? (
                    <><IconRotateClockwise size={14} /> Remettre en attente</>
                  ) : (
                    <><IconCheck size={14} /> Marquer terminée</>
                  )}
                </Button>
              </div>

              {/* Stripe */}
              {detailOrder.stripeSessionId && (
                <>
                  <div className="border-t border-gray-100" />
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Stripe</p>
                    <a
                      href={`https://dashboard.stripe.com/payments/${detailOrder.stripeSessionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-600 hover:text-blue-800 underline underline-offset-2"
                    >
                      <IconExternalLink size={12} />
                      {detailOrder.stripeSessionId}
                    </a>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
