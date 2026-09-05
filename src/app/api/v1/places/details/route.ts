import { NextRequest } from "next/server";
import ApiResponse from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    const placeId = req.nextUrl.searchParams.get("placeId")?.trim();

    if (!placeId) {
      return ApiResponse.badRequest("placeId is required");
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GOOGLE_PLACES_API_KEY in environment variables");
    }

    const googleRes = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "addressComponents",
        },
      }
    );

    if (!googleRes.ok) {
      const errorBody = await googleRes.text();
      console.error("Places details error:", errorBody);
      return ApiResponse.internalServerError("Failed to fetch address details");
    }

    const data = await googleRes.json();
    const components = data.addressComponents ?? [];

    let streetNumber = "";
    let route = "";
    let city = "";
    let pincode = "";

    for (const component of components) {
      const types = component.types ?? [];
      if (types.includes("street_number")) streetNumber = component.longText ?? "";
      else if (types.includes("route")) route = component.longText ?? "";
      else if (types.includes("locality")) city = component.longText ?? "";
      else if (types.includes("postal_code")) pincode = component.longText ?? "";
    }

    const addressLine = [streetNumber, route].filter(Boolean).join(" ");

    return ApiResponse.ok({ addressLine, city, pincode });
  } catch (error: any) {
    console.error("Error in places details route:", error);
    return ApiResponse.internalServerError(error.message ?? "Failed to fetch address details");
  }
}
