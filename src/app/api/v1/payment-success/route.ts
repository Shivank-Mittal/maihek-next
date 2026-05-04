import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  calculateCartTotal,
  getDeliveryMinimumMessage,
  isDeliveryMinimumMet,
} from "@/lib/checkout";
import { fulfillOrder, type OrderItem } from "@/lib/order-service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature")!;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error("[payment-success] Webhook signature error:", err);
      return new NextResponse(`Webhook Error: ${(err as Error).message}`, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const customer = session.customer_details;
      const meta = session.metadata ?? {};
      const orderType =
        (meta.orderType ?? session.custom_fields?.[0]?.dropdown?.value ?? "") as
          | "livraison"
          | "emporter"
          | "";

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

      const items: OrderItem[] = lineItems.data.map((item, i) => {
        const unitPrice = (item.price?.unit_amount ?? NaN) / 100;
        if (!Number.isFinite(unitPrice)) throw new Error(`Invalid price in line item ${i}`);
        const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
        return {
          name: item.description ?? "Unknown Item",
          quantity,
          price: Math.round(unitPrice * 100) / 100,
          _subtotal: Math.round(unitPrice * quantity * 100) / 100,
        };
      });

      const total = calculateCartTotal(items);
      if (!isDeliveryMinimumMet(orderType, total)) {
        return new NextResponse(getDeliveryMinimumMessage("EUR"), { status: 400 });
      }

      const fullAddress = [meta.addressLine, meta.addressFloor, meta.addressCity]
        .filter(Boolean)
        .join(", ");

      await fulfillOrder(
        {
          customerName: meta.customerName || customer?.name || "Anonymous",
          phone: meta.customerPhone || customer?.phone || "",
          email: meta.customerEmail || customer?.email || "",
          deliveryAddress: fullAddress || customer?.address?.line1 || "",
          addressPincode: meta.addressPincode || customer?.address?.postal_code || "",
          addressInstructions: meta.addressInstructions || "",
          orderType,
          items,
          total,
          stripeSessionId: session.id,
        },
        "En ligne (Stripe)"
      );

      if (session.invoice) {
        await stripe.invoices.sendInvoice(session.invoice as string);
      }
    }

    return new NextResponse("Webhook received", { status: 200 });
  } catch (error) {
    console.error("[payment-success] Unhandled error:", error);
    return new NextResponse("Webhook Error", { status: 400 });
  }
}
