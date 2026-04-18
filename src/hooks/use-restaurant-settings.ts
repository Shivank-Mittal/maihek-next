"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRestaurantStatus } from "@/hooks/use-restaurant-status";

export interface RestaurantStatusSettings {
  isOpen: boolean;
  useSchedule: boolean;
  manualIsOpen: boolean;
  windows: { open: string; close: string }[];
}

export const DEFAULT_WINDOWS = [
  { open: "11:45", close: "14:15" },
  { open: "18:30", close: "22:30" },
];

export function useRestaurantSettings(accessToken: string | undefined) {
  const { refresh: refreshRestaurantStatus } = useRestaurantStatus();
  const [settings, setSettings] = useState<RestaurantStatusSettings>({
    isOpen: true,
    useSchedule: false,
    manualIsOpen: true,
    windows: DEFAULT_WINDOWS,
  });
  const [loading, setLoading] = useState(false);

  const save = async (patch: Partial<RestaurantStatusSettings>) => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await fetch("/api/v1/restaurant-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(patch),
      });
      if (!response.ok) throw new Error("Impossible de mettre a jour le statut.");
      const data: RestaurantStatusSettings = await response.json();
      setSettings({ ...data, windows: patch.windows ?? data.windows ?? DEFAULT_WINDOWS });
      await refreshRestaurantStatus();
      toast.success("Statut du restaurant mis a jour.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur.");
    } finally {
      setLoading(false);
    }
  };

  return { settings, setSettings, loading, save };
}
