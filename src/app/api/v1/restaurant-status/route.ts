import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import connectDB from "@/lib/db";
import RestaurantStatus from "@/models/restaurant-status";
import { computeEffectiveIsOpen } from "@/lib/restaurant-hours";

const JWT_SECRET = process.env.JWT_SECRET as string;

function authorizeRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
  }

  try {
    verify(token, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 });
  }

  return null;
}

const DEFAULT_WINDOWS = [
  { open: "11:45", close: "14:15" },
  { open: "18:30", close: "22:30" },
];

export async function GET() {
  await connectDB();
  const doc = await RestaurantStatus.getStatus();
  const isOpen = computeEffectiveIsOpen(doc);
  const windows = doc.windows?.length ? doc.windows : DEFAULT_WINDOWS;

  console.log("[restaurant-status GET]", {
    isOpen,
    useSchedule: doc.useSchedule,
    manualIsOpen: doc.manualIsOpen,
    windows,
  });

  return NextResponse.json({
    isOpen,
    useSchedule: doc.useSchedule,
    manualIsOpen: doc.manualIsOpen,
    windows,
  });
}

export async function POST(request: NextRequest) {
  const authError = authorizeRequest(request);
  if (authError) return authError;

  try {
    await connectDB();

    const body = (await request.json()) as {
      useSchedule?: boolean;
      manualIsOpen?: boolean;
      windows?: { open: string; close: string }[];
    };

    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof body.useSchedule === "boolean") update["useSchedule"] = body.useSchedule;
    if (typeof body.manualIsOpen === "boolean") update["manualIsOpen"] = body.manualIsOpen;
    if (Array.isArray(body.windows)) update["windows"] = body.windows;

    const doc = await RestaurantStatus.findOneAndUpdate(
      {},
      { $set: update },
      { new: true, upsert: true }
    );
    const isOpen = computeEffectiveIsOpen(doc);
    const windows = doc.windows?.length ? doc.windows : DEFAULT_WINDOWS;

    console.log("[restaurant-status POST]", {
      isOpen,
      useSchedule: doc.useSchedule,
      manualIsOpen: doc.manualIsOpen,
      windows,
    });

    return NextResponse.json({
      isOpen,
      useSchedule: doc.useSchedule,
      manualIsOpen: doc.manualIsOpen,
      windows,
    });
  } catch (error) {
    console.error("Failed to update restaurant status:", error);
    return NextResponse.json({ error: "Failed to update restaurant status" }, { status: 500 });
  }
}
