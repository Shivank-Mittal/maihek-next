"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { ReservationStatus } from "@/hooks/use-reservation-control";

interface Props {
  reservationStatus: ReservationStatus;
  pendingStatus: "paused" | "resumed" | null;
  dialogOpen: boolean;
  loading: boolean;
  onToggle: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ReservationControlCard({
  reservationStatus,
  pendingStatus,
  dialogOpen,
  loading,
  onToggle,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <>
      <Card className="bg-white border border-gray-300 shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-900">
            Controle des Reservations
          </CardTitle>
          <CardDescription className="text-gray-500 text-sm mt-1">
            Actuellement :{" "}
            <span className="text-black font-medium">
              {reservationStatus.status === "paused" ? "Suspendu" : "Actif"}
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-gray-800">
              Reservation {reservationStatus.status === "paused" ? "Desactivee" : "Activee"}
            </span>
            <Switch
              checked={reservationStatus.status === "resumed"}
              onCheckedChange={onToggle}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) onCancel();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l'action</DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir{" "}
              <span className="font-semibold">
                {pendingStatus === "paused" ? "suspendre" : "reprendre"}
              </span>{" "}
              les reservations ?
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              Annuler
            </Button>
            <Button onClick={onConfirm} disabled={loading}>
              {loading ? "Mise a jour..." : "Confirmer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
