import { NextRequest } from "next/server";
import ApiResponse from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    const input = req.nextUrl.searchParams.get("input")?.trim();

    if (!input) {
      return ApiResponse.ok({ suggestions: [] });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GOOGLE_PLACES_API_KEY in environment variables");
    }

    const googleRes = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
      },
      body: JSON.stringify({
        input,
        includedRegionCodes: ["fr"],
        languageCode: "fr",
      }),
    });

    if (!googleRes.ok) {
      const errorBody = await googleRes.text();
      console.error("Places autocomplete error:", errorBody);
      return ApiResponse.internalServerError("Failed to fetch address suggestions");
    }

    const data = await googleRes.json();

    const suggestions = (data.suggestions ?? [])
      .map((s: any) => s.placePrediction)
      .filter(Boolean)
      .map((p: any) => ({
        placeId: p.placeId,
        text: p.text?.text ?? "",
      }));

    return ApiResponse.ok({ suggestions });
  } catch (error: any) {
    console.error("Error in places autocomplete route:", error);
    return ApiResponse.internalServerError(error.message ?? "Failed to fetch address suggestions");
  }
}
