import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  calculateCartTotal,
  getDeliveryMinimumMessage,
  isDeliveryMinimumMet,
  isDeliveryOrderType,
} from "@/lib/checkout";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-06-30.basil" as any,
});

type CheckoutItem = {
  name: string;
  image?: string;
  price: number;
  quantity: number;
};

type CustomerInfo = {
  name?: string;
  phone?: string;
  email?: string;
};

type AddressData = {
  addressLine: string;
  floor?: string;
  city: string;
  pincode: string;
  instructions?: string;
};

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const { items, orderType, customerInfo, address } = (await req.json()) as {
      items: CheckoutItem[];
      orderType?: string;
      customerInfo?: CustomerInfo;
      address?: AddressData;
    };

    const total = calculateCartTotal(items);

    if (!isDeliveryMinimumMet(orderType, total)) {
      return NextResponse.json({ error: getDeliveryMinimumMessage("EUR") }, { status: 400 });
    }

    const lineItems = items.map((item) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.name,
          ...(item.image ? { images: [item.image] } : {}),
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/success`,
      cancel_url: `${origin}/cancel`,
      currency: "EUR",
      metadata: {
        orderType: orderType ?? "emporter",
        customerName: customerInfo?.name ?? "",
        customerPhone: customerInfo?.phone ?? "",
        customerEmail: customerInfo?.email ?? "",
        addressLine: address?.addressLine ?? "",
        addressFloor: address?.floor ?? "",
        addressCity: address?.city ?? "",
        addressPincode: address?.pincode ?? "",
        addressInstructions: address?.instructions ?? "",
      },
      phone_number_collection: {
        enabled: true,
      },
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: "Ma description",
        },
      },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
