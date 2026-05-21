"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

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
  customerName: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  addressPincode: string;
  addressInstructions: string;
  orderType: "livraison" | "emporter" | "";
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  createdAt: string;
}

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const orderParam = params.get("order");
  const [order, setOrder] = useState<Order | null>(() => {
    if (!orderParam) return null;
    try { return JSON.parse(decodeURIComponent(orderParam)); } catch { return null; }
  });
  const [loading, setLoading] = useState(!orderParam && !!sessionId);

  useEffect(() => {
    if (!sessionId || orderParam) return;
    let attempts = 0;
    const maxAttempts = 8;

    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/v1/order-by-session?session_id=${sessionId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setOrder(json.data);
            setLoading(false);
            return;
          }
        }
      } catch {}

      if (attempts < maxAttempts) {
        setTimeout(poll, 2000);
      } else {
        setLoading(false);
      }
    };

    poll();
  }, [sessionId, orderParam]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-100 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
        <div className="text-center">
          <svg
            className="mx-auto h-16 w-16 text-green-500 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <h2 className="mt-6 text-4xl font-extrabold text-gray-800 tracking-tight">
            Commande passée !
          </h2>
          <p className="mt-3 text-lg text-gray-600 leading-relaxed">
            Miam ! Votre commande est confirmée et nos chefs commencent à la préparer.
          </p>
        </div>

        {loading && (
          <div className="bg-orange-50 p-6 rounded-lg text-gray-500 text-center text-sm animate-pulse">
            Chargement de votre commande…
          </div>
        )}

        {!loading && order && (
          <div className="bg-orange-50 rounded-xl p-6 space-y-4 text-gray-700 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold">Client</span>
              <span>{order.customerName}</span>
            </div>
            {order.phone && (
              <div className="flex justify-between">
                <span className="font-semibold">Téléphone</span>
                <span>{order.phone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-semibold">Type</span>
              <span>{order.orderType === "livraison" ? "Livraison" : "À emporter"}</span>
            </div>
            {order.orderType === "livraison" && order.deliveryAddress && (
              <div className="flex justify-between">
                <span className="font-semibold">Adresse</span>
                <span className="text-right">
                  {order.deliveryAddress}
                  {order.addressPincode ? ` ${order.addressPincode}` : ""}
                </span>
              </div>
            )}
            {order.addressInstructions && (
              <div className="flex justify-between">
                <span className="font-semibold">Instructions</span>
                <span className="text-right">{order.addressInstructions}</span>
              </div>
            )}

            <hr className="border-orange-200" />

            <ul className="space-y-1">
              {order.items.map((item, i) => (
                <li key={i} className="space-y-0.5">
                  <div className="flex justify-between">
                    <span>{item.quantity}× {item.name}</span>
                    <span>{item._subtotal.toFixed(2)} €</span>
                  </div>
                  {item.addons?.map((a, j) => (
                    <div key={j} className="flex justify-between text-gray-400 pl-4">
                      <span>+ {a.quantity}× {a.name}</span>
                      <span>{(a.price * a.quantity).toFixed(2)} €</span>
                    </div>
                  ))}
                </li>
              ))}
            </ul>

            <hr className="border-orange-200" />

            <div className="flex justify-between font-bold text-base text-gray-800">
              <span>Total</span>
              <span>{order.total.toFixed(2)} €</span>
            </div>

            {order.email && (
              <p className="text-gray-500 text-xs text-center">
                Confirmation envoyée à {order.email}
              </p>
            )}
          </div>
        )}

        {!loading && !order && (
          <div className="bg-orange-50 p-6 rounded-lg text-gray-700 text-base font-medium">
            Vous recevrez bientôt un e-mail de confirmation.
          </div>
        )}

        <Link
          href="/menu"
          className="block w-full py-3 px-6 text-center rounded-full shadow-md text-base font-semibold text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-200 transition duration-300"
        >
          Explorer le menu
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
