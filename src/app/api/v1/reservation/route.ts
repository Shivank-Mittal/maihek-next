import connectDB from "@/lib/db";
import ReservationStatus from "@/models/settings";
import { NextRequest, NextResponse } from "next/server";
import nodemailer, { SentMessageInfo } from "nodemailer";

// Define cart item interface for optional add-ons (matches ReservationForm)
interface CartItem {
  id?: string;
  name: { en: string; fr: string } | string;
  price: number;
  quantity?: number;
  option?: string;
  selectedItems?: Record<string, string>;
}

// Define reservation body interface (based on provided body)
interface ReservationBody {
  name: string;
  email: string;
  date: string;
  time: string;
  partySize: number | string; // Allow string for form data
  specialRequests?: string;
  phone?: string; // Optional as not in provided body
  addOns?: CartItem[];
  type: "reservation";
}

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.NEXT_PUBLIC_NODEMAILER_HOST as string | undefined,
  port: 587,
  secure: false,
  auth: {
    user: process.env.NEXT_PUBLIC_NODEMAILER_USERNAME as string | undefined,
    pass: process.env.NEXT_PUBLIC_NODEMAILER_PASSWORD as string | undefined,
  },
  tls: {
    rejectUnauthorized: false, // Temporary for testing (remove in production)
  },
});

// Handles POST requests to /api/send-email
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // check reservation status
    await connectDB();
    const status = await ReservationStatus.getStatus();
    if (status.status === "paused") {
      return NextResponse.json(
        {
          error: "Les réservations sont momentanément suspendues en raison d'une forte affluence.",
        },
        { status: 400 }
      );
    }
    const body: ReservationBody = await request.json();

    // Validate environment variables
    if (
      !process.env.NEXT_PUBLIC_NODEMAILER_HOST ||
      !process.env.NEXT_PUBLIC_NODEMAILER_USERNAME ||
      !process.env.NEXT_PUBLIC_NODEMAILER_PASSWORD
    ) {
      throw new Error("Missing email configuration in environment variables");
    }

    // Validate request type

    const { name, email, date, time, partySize, specialRequests, phone } = body;
    const response = await sendEmail({
      name,
      email,
      date,
      time,
      partySize,
      specialRequests,
      phone: phone || "Not provided",
    });

    return NextResponse.json({ message: "Email sent successfully!", response });
  } catch (error: any) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { message: "Error sending email", error: error.message },
      { status: 500 }
    );
  }
}

// Function to send reservation email with bilingual content
const sendEmail = async (params: {
  name: string;
  email: string;
  date: string;
  time: string;
  partySize: number | string;
  specialRequests?: string;
  phone?: string;
  addOns?: CartItem[];
}): Promise<SentMessageInfo> => {
  const { name, email, date, time, partySize, specialRequests, phone, addOns } = params;

  // Helper function to render add-on with bilingual names
  const renderItem = (item: CartItem) => {
    const nameEn = typeof item.name === "string" ? item.name : item.name.en;
    const nameFr = typeof item.name === "string" ? item.name : item.name.fr;
    return `
      <li>
        <p>English: ${nameEn} - Quantity: ${item.quantity || 1}, Price: ${item.price} €</p>
        <p>Français: ${nameFr} - Quantité: ${item.quantity || 1}, Prix: ${item.price} €</p>
        ${item.option ? `<ul><li>English: Option: ${item.option} | Français: Option: ${item.option}</li></ul>` : ""}
        ${
          item.selectedItems
            ? `<ul>${Object.entries(item.selectedItems)
                .map(
                  ([key, value]) =>
                    `<li>English: ${key}: ${value} | Français: ${key}: ${value}</li>`
                )
                .join("")}</ul>`
            : ""
        }
        <strong>English: Sub Total: ${(item.price * (item.quantity || 1)).toFixed(2)} € | Français: Sous-total: ${(item.price * (item.quantity || 1)).toFixed(2)} €</strong>
      </li>`;
  };

  try {
    const subject = `Reservation from ${name} | Réservation de ${name}`;
    const html = `
      <h1> Thank you for your reservation! | Merci pour votre réservation !</h1>
      <h3>New Reservation Details</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || "N/A"}</p>
      <p><strong>Date:</strong> ${new Date(date)
        .toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
        .replace(/(\w+) (\d{4})$/, "$1, $2")}</p>
      <p><strong>Time:</strong> ${time}</p>
      <p><strong>Party Size:</strong> ${partySize}</p>
      ${specialRequests ? `<p><strong>Special Requests:</strong> ${specialRequests}</p>` : ""}
      <p><strong>Add-Ons:</strong></p>
      ${
        addOns && addOns.length > 0
          ? `<ul>${addOns.map(renderItem).join("")}</ul>
             <strong>Total: ${addOns
               .reduce((total, item) => total + item.price * (item.quantity || 1), 0)
               .toFixed(2)} €</strong>`
          : `<p>No add-ons selected.</p>`
      }
      <hr style="margin: 20px 0;">

      <h3>Détails de la Nouvelle Réservation</h3>
      <p><strong>Nom:</strong> ${name}</p>
      <p><strong>E-mail:</strong> ${email}</p>
      <p><strong>Téléphone:</strong> ${phone || "N/A"}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Heure:</strong> ${time}</p>
      <p><strong>Nombre de Personnes:</strong> ${partySize}</p>
      ${specialRequests ? `<p><strong>Demandes Spéciales:</strong> ${specialRequests}</p>` : ""}
      <p><strong>Ajouts:</strong></p>
      ${
        addOns && addOns.length > 0
          ? `<ul>${addOns.map(renderItem).join("")}</ul>
             <strong>Total: ${addOns
               .reduce((total, item) => total + item.price * (item.quantity || 1), 0)
               .toFixed(2)} €</strong>`
          : `<p>Aucun ajout sélectionné.</p>`
      }
    `;

    const mail = await transporter.sendMail({
      from: `"Reservation - Maihak" <${process.env.NEXT_PUBLIC_NODEMAILER_USERNAME}>`,
      to: [
        process.env.NEXT_PUBLIC_NODEMAILER_RECIPIENT,
        email,
        process.env.NEXT_PUBLIC_NODEMAILER_ADMIN,
      ]
        .filter(Boolean)
        .join(", "),
      subject,
      html,
    });

    return mail;
  } catch (error: any) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};
