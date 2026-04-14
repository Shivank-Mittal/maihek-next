import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import {
  DELIVERY_MINIMUM_ORDER_AMOUNT,
  getDeliveryMinimumMessage,
  isDeliveryMinimumMet,
} from "@/lib/checkout";

// Define cart item interface (matches checkout page and CartContext)
export interface CartItem {
  id: string;
  name: string;
  price: number; // should be unit price, not already multiplied
  quantity?: number;
  option?: string;
  selectedItems?: Record<string, string>;
}

// Define request body interface
interface RequestBody {
  name: string;
  orders: CartItem[];
  phone: string;
  email: string;
  address?: string;
  zipcode?: string;
  orderType?: string;
  instructions?: string;
}

// Configure nodemailer transporter
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

// Small helpers to avoid floating-point weirdness and bad inputs
const toNumber = (v: unknown, fallback = 0): number => {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
};
const clampQty = (q: unknown): number => {
  const n = Math.floor(toNumber(q, 1));
  return n >= 1 ? n : 1;
};
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

type SafeOrder = CartItem & {
  quantity: number; // normalized
  price: number; // normalized unit price
  _subtotal: number; // computed once, used everywhere
};

// Handles POST requests to /api/send-email
export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { name, orders, phone, email, address, zipcode, orderType, instructions } = body;

    // Validate/normalize orders deterministically
    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json({ message: "No orders supplied" }, { status: 400 });
    }

    const safeOrders: SafeOrder[] = orders.map((o, i) => {
      const quantity = clampQty(o.quantity);
      const price = round2(toNumber(o.price, 0));
      if (price < 0) {
        throw new Error(`Invalid price at item ${i}: ${o.price}`);
      }
      const _subtotal = round2(price * quantity);
      return { ...o, quantity, price, _subtotal };
    });

    const total = safeOrders.reduce((sum, order) => sum + order._subtotal, 0);
    if (!isDeliveryMinimumMet(orderType, total)) {
      return NextResponse.json(
        {
          message: getDeliveryMinimumMessage("EUR"),
          minimum: DELIVERY_MINIMUM_ORDER_AMOUNT,
        },
        { status: 400 }
      );
    }

    const response = await sendEmail(
      name,
      safeOrders,
      phone,
      email,
      address,
      zipcode,
      orderType,
      instructions
    );
    return NextResponse.json({ message: "Email sent successfully!", response });
  } catch (error: any) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { message: "Error sending email", error: error.message },
      { status: 500 }
    );
  }
}

// Function to send email
const sendEmail = async (
  name: string,
  orders: (CartItem & { quantity: number; price: number; _subtotal: number })[],
  phone: string,
  email: string,
  address?: string,
  zipcode?: string,
  orderType?: string,
  instructions?: string
) => {
  console.log("Sending email to:", email); // Log the recipient's email

  // Custom message based on order type
  let orderMessage = "";
  if (orderType?.toLowerCase() === "livraison") {
    orderMessage =
      "<p style='color:#1d4ed8;font-weight:bold;'>🚚 Votre commande sera livrée dans 40 minutes.</p>";
  } else if (orderType?.toLowerCase() === "emporter") {
    orderMessage =
      "<p style='color:#16a34a;font-weight:bold;'>🥡 Vous pouvez récupérer votre commande dans 20 minutes.</p>";
  }

  // Compute grand total once, from precomputed subtotals
  const grandTotal = orders.reduce((sum, o) => sum + o._subtotal, 0);
  const grandTotalStr = grandTotal.toFixed(2);

  try {
    const mail = await transporter.sendMail({
      from: `"Order - Maihak" <${process.env.NEXT_PUBLIC_NODEMAILER_USERNAME}>`,
      to: [email, process.env.NEXT_PUBLIC_NODEMAILER_ADMIN].filter(Boolean).join(", "), // Filter out undefined values
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
                      <p><strong>${order.name}</strong> <br/> Quantité: ${order.quantity} <br/> Prix unitaire: ${order.price.toFixed(2)} €</p>
                      ${order.option ? `<p style="margin:4px 0;"><em>Option:</em> ${order.option}</p>` : ""}
                      ${
                        order.selectedItems
                          ? `<ul style="margin:4px 0 0 15px;">${Object.entries(order.selectedItems)
                              .map(([key, value]) => `<li>${key}: ${value}</li>`)
                              .join("")}</ul>`
                          : ""
                      }
                      <p style="font-weight:bold; color:#2563eb;">Sous-total: ${order._subtotal.toFixed(2)} €</p>
                    </li>`
                )
                .join("")}
            </ul>
          </div>

          <p style="font-size:18px; font-weight:bold; color:#dc2626; margin-top:20px;">
            💰 Total: ${grandTotalStr} €
          </p>

          ${address ? `<p><strong>Adresse:</strong> ${address}</p>` : ""}
          ${zipcode ? `<p><strong>Code postal:</strong> ${zipcode}</p>` : ""}
          ${instructions ? `<p><strong>Instructions:</strong> ${instructions}</p>` : ""}
          ${orderType ? `<p><strong>Type de commande:</strong> ${orderType}</p>` : ""}
          <p><strong>Mode de paiement:</strong> Espèces (Cash)</p>

          ${orderMessage}

          <hr style="margin:25px 0; border:0; border-top:1px solid #e5e7eb;" />
          <p style="font-size:12px; color:#6b7280; text-align:center;">© 2025 Maihak. Merci de votre confiance.</p>
        </div>
      `,
    });

    return mail; // Return mail info on success
  } catch (error: any) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};
