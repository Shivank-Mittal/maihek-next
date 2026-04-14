import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { ApiError } from "next/dist/server/api-utils";
import connectDB from "@/lib/db";
import DiscountSettings from "@/models/discount-settings";
import { sanitizeTakeawayDiscountSettings } from "@/lib/checkout";

const JWT_SECRET = process.env.JWT_SECRET as string;

const serializeSettings = (settings: Awaited<ReturnType<typeof DiscountSettings.getSettings>>) => ({
  takeawayDiscount: sanitizeTakeawayDiscountSettings(settings.takeawayDiscount),
  updatedAt: settings.updatedAt?.toISOString(),
});

async function authorizeRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    throw new ApiError(401, "Unauthorized: No token provided");
  }

  verify(token, JWT_SECRET);
}

export async function GET() {
  await connectDB();
  const settings = await DiscountSettings.getSettings();

  return NextResponse.json(serializeSettings(settings));
}

export async function POST(request: NextRequest) {
  try {
    await authorizeRequest(request);
    await connectDB();

    const body = (await request.json()) as {
      takeawayDiscount?: ReturnType<typeof sanitizeTakeawayDiscountSettings>;
    };
    const takeawayDiscount = sanitizeTakeawayDiscountSettings(body.takeawayDiscount);

    const updatedSettings = await DiscountSettings.findOneAndUpdate(
      {},
      {
        takeawayDiscount,
        updatedAt: new Date(),
      },
      { new: true, upsert: true }
    );

    return NextResponse.json(serializeSettings(updatedSettings));
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof ApiError ? error.message : "Failed to update discount settings",
      },
      { status: error instanceof ApiError ? error.statusCode : 500 }
    );
  }
}
