"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS } from "@/lib/checkout";
import { updateDiscountSettings } from "@/services/discount-settings-service";
import type { TakeawayDiscountSettings } from "@repo-types/discounts";

export function useTakeawayDiscount(accessToken: string | undefined) {
  const [takeawayDiscount, setTakeawayDiscount] = useState<TakeawayDiscountSettings>(
    DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS
  );
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!accessToken) {
      toast.error("Session admin introuvable.");
      return;
    }
    setLoading(true);
    try {
      const response = await updateDiscountSettings(takeawayDiscount, accessToken);
      setTakeawayDiscount(response.takeawayDiscount);
      toast.success("Remise a emporter mise a jour.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'enregistrer la remise.");
    } finally {
      setLoading(false);
    }
  };

  return { takeawayDiscount, setTakeawayDiscount, loading, save };
}
