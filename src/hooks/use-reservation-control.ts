"use client";

import { useState } from "react";
import { toast } from "sonner";

export interface ReservationStatus {
  status: "paused" | "resumed";
}

export function useReservationControl(accessToken: string | undefined) {
  const [reservationStatus, setReservationStatus] = useState<ReservationStatus>({
    status: "resumed",
  });
  const [pendingStatus, setPendingStatus] = useState<"paused" | "resumed" | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const requestToggle = () => {
    const next = reservationStatus.status === "paused" ? "resumed" : "paused";
    setPendingStatus(next);
    setDialogOpen(true);
  };

  const cancelToggle = () => {
    setDialogOpen(false);
    setPendingStatus(null);
  };

  const confirmToggle = async () => {
    if (!pendingStatus || !accessToken) return;
    setLoading(true);
    try {
      const response = await fetch("/api/v1/reservation-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: pendingStatus }),
      });
      if (!response.ok) throw new Error("Impossible de mettre a jour les reservations.");
      const data: ReservationStatus = await response.json();
      setReservationStatus(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur de mise a jour.");
    } finally {
      setLoading(false);
      setDialogOpen(false);
      setPendingStatus(null);
    }
  };

  return {
    reservationStatus,
    setReservationStatus,
    pendingStatus,
    dialogOpen,
    loading,
    requestToggle,
    cancelToggle,
    confirmToggle,
  };
}
