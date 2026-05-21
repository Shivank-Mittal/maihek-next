import { NextRequest, NextResponse } from "next/server";
import {
  DELIVERY_MINIMUM_ORDER_AMOUNT,
  getDeliveryMinimumMessage,
  isDeliveryMinimumMet,
} from "@/lib/checkout";
import { fulfillOrder, type OrderItem } from "@/lib/order-service";

interface CartItemAddon {
  name: string;
  price: number;
  quantity: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  selectedItems?: Record<string, string>;
  addons?: CartItemAddon[];
}

interface RequestBody {
  name: string;
  orders: CartItem[];
  phone: string;
  email: string;
  address?: string;
  zipcode?: string;
  orderType?: string;
  paymentMethod?: string;
  instructions?: string;
}

const toNumber = (v: unknown, fallback = 0): number => {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
};
const clampQty = (q: unknown): number => Math.max(1, Math.floor(toNumber(q, 1)));
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { name, orders, phone, email, address, zipcode, orderType, paymentMethod, instructions } = body;

    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json({ message: "No orders supplied" }, { status: 400 });
    }

    const items: OrderItem[] = orders.map((o, i) => {
      const quantity = clampQty(o.quantity);
      const price = round2(toNumber(o.price, 0));
      if (price < 0) throw new Error(`Invalid price at item ${i}: ${o.price}`);
      const addons = (o.addons ?? []).map((a) => ({
        name: a.name,
        price: round2(toNumber(a.price, 0)),
        quantity: clampQty(a.quantity),
      }));
      return {
        name: o.name,
        price,
        quantity,
        _subtotal: round2(price * quantity),
        ...(addons.length ? { addons } : {}),
      };
    });

    const total = round2(items.reduce((sum, item) => sum + item._subtotal, 0));

    if (!isDeliveryMinimumMet(orderType, total)) {
      return NextResponse.json(
        { message: getDeliveryMinimumMessage("EUR"), minimum: DELIVERY_MINIMUM_ORDER_AMOUNT },
        { status: 400 }
      );
    }

    await fulfillOrder(
      {
        customerName: name,
        phone,
        email,
        deliveryAddress: address ?? "",
        addressPincode: zipcode ?? "",
        addressInstructions: instructions ?? "",
        orderType: (orderType as "livraison" | "emporter") ?? "",
        items,
        total,
        paymentMethod: paymentMethod ?? "",
      },
      paymentMethod === "cod_card" ? "Carte (à la livraison)" : "Espèces (à la livraison)"
    );

    return NextResponse.json({ message: "Order received successfully!" });
  } catch (error: any) {
    console.error("[send-email] Error:", error);
    return NextResponse.json({ message: "Error processing order", error: error.message }, { status: 500 });
  }
}
