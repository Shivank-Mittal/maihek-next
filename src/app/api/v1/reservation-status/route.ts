import { NextRequest, NextResponse } from "next/server";
import ReservationStatus from "@/models/settings";
import connectDB from "@/lib/db";
import jwt, { verify } from "jsonwebtoken";
import { ApiError } from "next/dist/server/api-utils";

const JWT_SECRET = process.env.JWT_SECRET as string;

async function middleware(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cookieToken = req.cookies.get("next-auth.session-token")?.value;

  if (!authHeader && !cookieToken) {
    throw new ApiError(401, "Unauthorized: No token provided");
  }

  // Prefer token from cookie, fallback to Authorization header Bearer token
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    throw new ApiError(401, "Unauthorized: No token provided");
  }

  try {
    verify(token, JWT_SECRET);
  } catch (error) {
    console.error("Error verifying token:", error);
    // throw new ApiError(401, 'Unauthorized: Invalid or expired token');
  }
}

export async function GET() {
  await connectDB();
  const status = await ReservationStatus.getStatus();
  return NextResponse.json(status);
}

export async function POST(request: NextRequest) {
  try {
    await middleware(request);
    await connectDB();
    const { status } = await request.json();
    if (status !== "paused" && status !== "resumed") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const updatedStatus = await ReservationStatus.findOneAndUpdate(
      {},
      { status, updatedAt: new Date() },
      { new: true, upsert: true }
    );
    return NextResponse.json(updatedStatus);
  } catch (error) {
    console.error("Error updating reservation status:", error);
    return NextResponse.json(
      { error: error instanceof ApiError ? error.message : "Failed to update reservation status" },
      { status: error instanceof ApiError ? error.statusCode : 500 }
    );
  }
}
