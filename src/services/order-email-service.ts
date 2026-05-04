import nodemailer from "nodemailer";
import type { OrderPayload } from "@/lib/order-service";

const transporter = nodemailer.createTransport({
  host: process.env.NEXT_PUBLIC_NODEMAILER_HOST as string,
  port: 465,
  secure: true,
  auth: {
    user: process.env.NEXT_PUBLIC_NODEMAILER_USERNAME as string,
    pass: process.env.NEXT_PUBLIC_NODEMAILER_PASSWORD as string,
  },
  tls: { rejectUnauthorized: false },
});

function buildEmailHtml(payload: OrderPayload, paymentLabel: string): string {
  const orderTypeMessage =
    payload.orderType === "livraison"
      ? "<p style='color:#1d4ed8;font-weight:bold;'>🚚 Votre commande sera livrée dans 40 minutes.</p>"
      : payload.orderType === "emporter"
        ? "<p style='color:#16a34a;font-weight:bold;'>🥡 Vous pouvez récupérer votre commande dans 20 minutes.</p>"
        : "";

  const itemRows = payload.items
    .map(
      (item) => `
      <li style="margin-bottom:15px;background:#fff;padding:10px;border-radius:8px;border:1px solid #e5e7eb;">
        <p><strong>${item.name}</strong><br/>
           Quantité: ${item.quantity}<br/>
           Prix unitaire: ${item.price.toFixed(2)} €</p>
        ${item.option ? `<p style="margin:4px 0;"><em>Option:</em> ${item.option}</p>` : ""}
        <p style="font-weight:bold;color:#2563eb;">Sous-total: ${item._subtotal.toFixed(2)} €</p>
      </li>`
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;background:#fff;padding:25px;border-radius:12px;border:1px solid #e5e7eb;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
      <h1 style="background:linear-gradient(90deg,#dc2626,#f59e0b);color:#fff;text-align:center;padding:15px;border-radius:8px;">
        Merci pour votre commande !
      </h1>
      <h3 style="color:#374151;margin-top:20px;">📋 Détails de la commande</h3>
      <p><strong>Nom:</strong> ${payload.customerName}</p>
      <p><strong>Téléphone:</strong> ${payload.phone}</p>
      <p><strong>Email:</strong> ${payload.email}</p>
      <div style="margin-top:15px;background:#f3f4f6;padding:15px;border-radius:8px;">
        <p style="font-weight:bold;margin-bottom:8px;">🛒 Commandes:</p>
        <ul style="padding-left:15px;color:#111827;list-style:disc;">${itemRows}</ul>
      </div>
      <p style="font-size:18px;font-weight:bold;color:#dc2626;margin-top:20px;">
        💰 Total: ${payload.total.toFixed(2)} €
      </p>
      ${payload.deliveryAddress ? `<p><strong>Adresse:</strong> ${payload.deliveryAddress}</p>` : ""}
      ${payload.addressPincode ? `<p><strong>Code postal:</strong> ${payload.addressPincode}</p>` : ""}
      ${payload.addressInstructions ? `<p><strong>Instructions:</strong> ${payload.addressInstructions}</p>` : ""}
      ${payload.orderType ? `<p><strong>Type de commande:</strong> ${payload.orderType}</p>` : ""}
      <p><strong>Mode de paiement:</strong> ${paymentLabel}</p>
      ${orderTypeMessage}
      <hr style="margin:25px 0;border:0;border-top:1px solid #e5e7eb;"/>
      <p style="font-size:12px;color:#6b7280;text-align:center;">© 2025 Maihak. Merci de votre confiance.</p>
    </div>`;
}

export async function sendOrderEmail(payload: OrderPayload, paymentLabel: string): Promise<void> {
  const recipients = [payload.email, process.env.NEXT_PUBLIC_NODEMAILER_ADMIN]
    .filter(Boolean)
    .join(", ");

  await transporter.sendMail({
    from: `"Order - Maihak" <${process.env.NEXT_PUBLIC_NODEMAILER_USERNAME}>`,
    to: recipients,
    subject: `Order from ${payload.customerName}`,
    html: buildEmailHtml(payload, paymentLabel),
  });
}
