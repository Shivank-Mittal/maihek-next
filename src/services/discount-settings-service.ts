import type { DiscountSettingsResponse, TakeawayDiscountSettings } from "@repo-types/discounts";

const DISCOUNT_SETTINGS_ENDPOINT = "/api/v1/discount-settings";

export async function getDiscountSettings(): Promise<DiscountSettingsResponse> {
  const response = await fetch(DISCOUNT_SETTINGS_ENDPOINT, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch discount settings");
  }

  return (await response.json()) as DiscountSettingsResponse;
}

export async function updateDiscountSettings(
  takeawayDiscount: TakeawayDiscountSettings,
  accessToken: string
): Promise<DiscountSettingsResponse> {
  const response = await fetch(DISCOUNT_SETTINGS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ takeawayDiscount }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Failed to update discount settings");
  }

  return (await response.json()) as DiscountSettingsResponse;
}
