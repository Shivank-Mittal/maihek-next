import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import nodemailer from "nodemailer";
import connectDB from "@/lib/db";
import { Order } from "@/models/order";
import { PushSubscription } from "@/models/push-subscription";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL as string,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
);
import {
  calculateCartTotal,
  getDeliveryMinimumMessage,
  isDeliveryMinimumMet,
} from "@/lib/checkout";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;

const transporter = nodemailer.createTransport({
  host: process.env.NEXT_PUBLIC_NODEMAILER_HOST as string,
  port: 465, // or 587
  secure: true,
  auth: {
    user: process.env.NEXT_PUBLIC_NODEMAILER_USERNAME as string,
    pass: process.env.NEXT_PUBLIC_NODEMAILER_PASSWORD as string,
  },
  tls: {
    rejectUnauthorized: false, // Temporary for testing (remove in production)
  },
});

// Handles webhook POST requests from Stripe
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature")!;
    let event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.log(err, "err");
      return new NextResponse(`Webhook Error: ${(err as Error).message}`, {
        status: 400,
      });
    }

    // Handle checkout session completion
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const customer = session.customer_details;
      const orderType =
        session.metadata?.orderType ?? session.custom_fields?.[0]?.dropdown?.value ?? "";

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

      const order: CartItem[] = lineItems.data.map((item, i) => {
        const unitPrice = (item.price?.unit_amount ?? NaN) / 100;
        if (!Number.isFinite(unitPrice)) {
          throw new Error(`Invalid price in line item ${i}`);
        }

        const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
        const subtotal = Math.round(unitPrice * quantity * 100) / 100;

        return {
          name: item.description ?? "Unknown Item", // Fallback for null
          quantity,
          price: Math.round(unitPrice * 100) / 100,
          _subtotal: subtotal,
        };
      });

      const total = calculateCartTotal(order);
      if (!isDeliveryMinimumMet(orderType, total)) {
        return new NextResponse(getDeliveryMinimumMessage("EUR"), { status: 400 });
      }

      const meta = session.metadata ?? {};
      const fullAddress = [meta.addressLine, meta.addressFloor, meta.addressCity]
        .filter(Boolean)
        .join(", ");

      try {
        await connectDB();
        await Order.create({
          customerName: meta.customerName || customer?.name || "Anonymous",
          phone: meta.customerPhone || customer?.phone || "",
          email: meta.customerEmail || customer?.email || "",
          deliveryAddress: fullAddress || customer?.address?.line1 || "",
          addressPincode: meta.addressPincode || customer?.address?.postal_code || "",
          addressInstructions: meta.addressInstructions || "",
          orderType,
          items: order,
          total,
          status: "pending",
          stripeSessionId: session.id,
        });
      } catch (dbErr) {
        console.error("Failed to persist order to DB:", dbErr);
      }

      // Send push notifications to all subscribed admin devices
      try {
        await connectDB();
        const subscriptions = await PushSubscription.find().lean();
        const customerName = meta.customerName || customer?.name || "Anonymous";
        const payload = JSON.stringify({
          title: "Nouvelle commande !",
          body: `${customerName} — ${total.toFixed(2)} €`,
        });
        await Promise.allSettled(
          subscriptions.map((sub) =>
            webpush.sendNotification(
              { endpoint: sub.endpoint, keys: sub.keys },
              payload
            )
          )
        );
      } catch (pushErr) {
        console.error("Failed to send push notification:", pushErr);
      }

      const response = await sendEmail(
        meta.customerName || customer?.name || "Anonymous",
        order,
        meta.customerPhone || customer?.phone || "",
        meta.customerEmail || customer?.email || "",
        fullAddress || customer?.address?.line1 || "",
        meta.addressPincode || customer?.address?.postal_code || "",
        orderType,
        meta.addressInstructions || ""
      );
      console.log(response, "response");

      // Auto send invoice if available
      if (session.invoice) {
        await stripe.invoices.sendInvoice(session.invoice as string);
      }
    }

    return new NextResponse("Webhook received", { status: 200 });
  } catch (error) {
    console.log(error, "error");
    return new NextResponse("Webhook Error", { status: 400 });
  }
}

const sendEmail = async (
  name: string,
  orders: CartItem[],
  phone: string,
  email: string,
  address?: string,
  zipcode?: string,
  orderType?: string,
  instructions?: string
) => {
  console.log("Sending email to:", email);

  // Custom message based on order type
  let orderMessage = "";
  if (orderType?.toLowerCase() === "livraison") {
    orderMessage =
      "<p style='color:#1d4ed8;font-weight:bold;'>🚚 Votre commande sera livrée dans 40 minutes.</p>";
  } else if (orderType?.toLowerCase() === "emporter") {
    orderMessage =
      "<p style='color:#16a34a;font-weight:bold;'>🥡 Vous pouvez récupérer votre commande dans 20 minutes.</p>";
  }

  try {
    const total = orders.reduce((t, o) => t + o._subtotal, 0);

    const mail = await transporter.sendMail({
      from: `"Order - Maihak" <${process.env.NEXT_PUBLIC_NODEMAILER_USERNAME}>`,
      to: [email, process.env.NEXT_PUBLIC_NODEMAILER_ADMIN].filter(Boolean).join(", "),
      subject: `Order from ${name}`,
      html: `
        <div style="font-family:Arial, sans-serif; max-width:650px; margin:auto; background:#ffffff; padding:25px; border-radius:12px; border:1px solid #e5e7eb; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
          
          <h1 style="background:linear-gradient(90deg,#dc2626,#f59e0b); color:#fff; text-align:center; padding:15px; border-radius:8px;">
            Merci pour votre commande !
          </h1>

          <h3 style="color:#374151; margin-top:20px;">📋 Détails de la commande</h3>
          <p><strong>Nom:</strong> ${name}</p>
          <p><strong>Téléphone:</strong> ${phone}</p>
          <p><strong>Email:</strong> ${email}</p>

          <div style="margin-top:15px; background:#f3f4f6; padding:15px; border-radius:8px;">
            <p style="font-weight:bold; margin-bottom:8px;">🛒 Commandes:</p>
            <ul style="padding-left:15px; color:#111827; list-style:disc;">
              ${orders
                .map(
                  (order) => `
                    <li style="margin-bottom:15px; background:#fff; padding:10px; border-radius:8px; border:1px solid #e5e7eb;">
                      <p><strong>${order.name}</strong> <br/> Quantité: ${
                        order.quantity
                      } <br/> Prix unitaire: ${order.price.toFixed(2)} €</p>
                      <p style="font-weight:bold; color:#2563eb;">Sous-total: ${order._subtotal.toFixed(
                        2
                      )} €</p>
                    </li>`
                )
                .join("")}
            </ul>
          </div>

          <p style="font-size:18px; font-weight:bold; color:#dc2626; margin-top:20px;">
            💰 Total: ${total.toFixed(2)} €
          </p>

          ${address ? `<p><strong>Adresse:</strong> ${address}</p>` : ""}
          ${zipcode ? `<p><strong>Code postal:</strong> ${zipcode}</p>` : ""}
          ${instructions ? `<p><strong>Instructions:</strong> ${instructions}</p>` : ""}
          ${orderType ? `<p><strong>Type de commande:</strong> ${orderType}</p>` : ""}
          <p><strong>Mode de paiement:</strong> en ligne (Online)</p>

          ${orderMessage}

          <hr style="margin:25px 0; border:0; border-top:1px solid #e5e7eb;" />
          <p style="font-size:12px; color:#6b7280; text-align:center;">© 2025 Maihak. Merci de votre confiance.</p>
        </div>
      `,
    });

    return mail;
  } catch (error: any) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

interface CartItem {
  id?: string;
  name: string | null; // Allow null
  price: number;
  quantity: number;
  _subtotal: number;
  option?: string;
  selectedItems?: Record<string, string>;
}
