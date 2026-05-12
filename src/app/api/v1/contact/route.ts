import { NextRequest, NextResponse } from "next/server";
import nodemailer, { SentMessageInfo } from "nodemailer";

// Define contact form body interface
interface ContactBody {
  name: string;
  email: string;
  message: string;
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

// Handles POST requests to /api/contact
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ContactBody = await request.json();

    // Validate environment variables
    if (
      !process.env.NEXT_PUBLIC_NODEMAILER_HOST ||
      !process.env.NEXT_PUBLIC_NODEMAILER_USERNAME ||
      !process.env.NEXT_PUBLIC_NODEMAILER_PASSWORD
    ) {
      throw new Error("Missing email configuration in environment variables");
    }

    // Validate required fields
    const { name, email, message } = body;
    if (!name || !email || !message) {
      throw new Error("Missing required fields: name, email, and message are required");
    }

    const response = await sendEmail({ name, email, message });

    return NextResponse.json({ message: "Email sent successfully!", response });
  } catch (error: any) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { message: "Error sending email", error: error.message },
      { status: 500 }
    );
  }
}

// Function to send contact email with bilingual content
const sendEmail = async (params: {
  name: string;
  email: string;
  message: string;
}): Promise<SentMessageInfo> => {
  const { name, email, message } = params;

  console.log("Sending contact email to:", email);

  try {
    const subject = `Contact Message from ${name} | Message de Contact de ${name}`;
    const html = `
      <h1> Thank you for your message! | Merci pour votre message !</h1>
      <h3>New Contact Message | Nouveau Message de Contact</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong> ${message}</p>
      <hr style="margin: 20px 0;">
      
      <p>Best regards, | Cordialement, </p>
      <p>Team Maihak | Equipe Maihak</p>
    `;

    const mail = await transporter.sendMail({
      from: `"Contact - Maihak" <${process.env.NEXT_PUBLIC_NODEMAILER_USERNAME}>`,
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
