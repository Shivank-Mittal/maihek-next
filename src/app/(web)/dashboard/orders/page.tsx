"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Printer, Bell, BellOff } from "lucide-react";
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
  createdAt: string;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
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

const playBeep = () => {
  const ctx = new AudioContext();

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

  // 3 quick beeps
  beep(ctx.currentTime);
  beep(ctx.currentTime + 0.35);
  beep(ctx.currentTime + 0.7);
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const lastCountRef = useRef<number | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/orders");
      const json = await res.json();
      if (!json.success) return;
      const incoming: Order[] = json.data;
      if (lastCountRef.current !== null && incoming.length > lastCountRef.current) {
        playBeep();
      }
      lastCountRef.current = incoming.length;
      setOrders(incoming);
    } catch {
      // silently fail on poll errors
    }
  }, []);

  useEffect(() => {
    fetchOrders().finally(() => setLoading(false));
    const id = setInterval(fetchOrders, 10_000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  // Check if already subscribed on mount
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setPushSubscribed(!!sub);
    });
  }, []);

  const handlePushToggle = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Les notifications push ne sont pas supportées sur ce navigateur.");
      return;
    }
    setPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const existing = await reg.pushManager.getSubscription();

      if (existing) {
        // Unsubscribe
        await existing.unsubscribe();
        await fetch("/api/v1/push-subscription", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: existing.endpoint }),
        });
        setPushSubscribed(false);
      } else {
        // Subscribe
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          alert("Permission refusée. Activez les notifications dans les paramètres.");
          return;
        }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            "BJPGQ52zIPFLgddBXW2apV55TjMvakT2vraAlZXw6XU_yx1Eixwa4VSexWM8C9rLycKOD-lawePPblxiYpiMynE"
          ),
        });
        await fetch("/api/v1/push-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        });
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
                    <TableHead>Articles</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
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
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}
