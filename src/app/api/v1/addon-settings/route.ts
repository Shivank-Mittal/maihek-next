import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { ApiError } from "next/dist/server/api-utils";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import AddonSettings from "@/models/addon-settings";
import { ADDONS_ENABLED } from "@/lib/addon-settings";

const JWT_SECRET = process.env.JWT_SECRET as string;

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
  const settings = await AddonSettings.getSettings();

  return NextResponse.json({
    globalEnabled: settings.globalEnabled,
    excludedCategoryNames: settings.excludedCategoryNames,
    excludedDishIds: settings.excludedDishIds,
    dishExcludedAddonIds: settings.dishExcludedAddonIds ?? {},
    updatedAt: settings.updatedAt?.toISOString(),
  });
}

export async function POST(request: NextRequest) {
  if (!ADDONS_ENABLED) {
    return NextResponse.json({ error: "Addons are disabled" }, { status: 403 });
  }
  try {
    await authorizeRequest(request);
    await connectDB();

    const body = (await request.json()) as {
      globalEnabled?: boolean;
      excludedCategoryNames?: string[];
      excludedDishIds?: string[];
      dishExcludedAddonIds?: Record<string, string[]>;
    };

    const normalizedBody = {
      globalEnabled: body.globalEnabled ?? true,
      excludedCategoryNames: Array.isArray(body.excludedCategoryNames) ? body.excludedCategoryNames : [],
      excludedDishIds: Array.isArray(body.excludedDishIds) ? body.excludedDishIds : [],
      dishExcludedAddonIds:
        body.dishExcludedAddonIds && typeof body.dishExcludedAddonIds === "object"
          ? body.dishExcludedAddonIds
          : {},
      updatedAt: new Date(),
    };

    await mongoose.connection.collection("addonsettings").updateOne(
      {},
      { $set: normalizedBody },
      { upsert: true }
    );

    return NextResponse.json({
      globalEnabled: normalizedBody.globalEnabled,
      excludedCategoryNames: normalizedBody.excludedCategoryNames,
      excludedDishIds: normalizedBody.excludedDishIds,
      dishExcludedAddonIds: normalizedBody.dishExcludedAddonIds,
      updatedAt: normalizedBody.updatedAt.toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof ApiError ? error.message : "Failed to update addon settings",
      },
      { status: error instanceof ApiError ? error.statusCode : 500 }
    );
  }
}
