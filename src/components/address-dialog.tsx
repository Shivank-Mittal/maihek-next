"use client";

import { useForm } from "react-hook-form";
import { MapPin, Building2, Hash, Navigation, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface AddressData {
  addressLine: string;
  floor?: string;
  city: string;
  pincode: string;
  instructions?: string;
}

interface AddressDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (address: AddressData) => void;
  isSubmitting?: boolean;
  /** Label on the confirm button — e.g. "Payer en ligne" or "Confirmer la commande" */
  confirmLabel?: string;
}

export function AddressDialog({
  open,
  onClose,
  onConfirm,
  isSubmitting = false,
  confirmLabel = "Confirmer",
}: AddressDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddressData>();

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (data: AddressData) => {
    onConfirm(data);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <MapPin className="h-5 w-5 text-indigo-600" />
            Adresse de livraison
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Renseignez votre adresse complète pour la livraison.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Address line */}
          <div className="space-y-1.5">
            <Label htmlFor="addressLine">
              Adresse <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="addressLine"
                className="pl-9"
                placeholder="12 Rue de la Paix"
                aria-invalid={errors.addressLine ? "true" : "false"}
                {...register("addressLine", {
                  required: "L'adresse est requise",
                  minLength: { value: 5, message: "Adresse trop courte" },
                })}
              />
            </div>
            {errors.addressLine && (
              <p className="text-xs text-red-500">{errors.addressLine.message}</p>
            )}
          </div>

          {/* Floor / Apt — optional */}
          <div className="space-y-1.5">
            <Label htmlFor="floor">Étage / Appartement</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="floor"
                className="pl-9"
                placeholder="Bât. B, 3ème étage, Apt. 12"
                {...register("floor")}
              />
            </div>
          </div>

          {/* City + Pincode in a row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="city">
                Ville <span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                placeholder="Paris"
                aria-invalid={errors.city ? "true" : "false"}
                {...register("city", { required: "Ville requise" })}
              />
              {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pincode">
                Code postal <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="pincode"
                  className="pl-9"
                  placeholder="75001"
                  maxLength={5}
                  aria-invalid={errors.pincode ? "true" : "false"}
                  {...register("pincode", {
                    required: "Code postal requis",
                    pattern: {
                      value: /^[0-9]{5}$/,
                      message: "5 chiffres requis",
                    },
                  })}
                />
              </div>
              {errors.pincode && <p className="text-xs text-red-500">{errors.pincode.message}</p>}
            </div>
          </div>

          {/* Delivery instructions — optional */}
          <div className="space-y-1.5">
            <Label htmlFor="instructions">Instructions (optionnel)</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <textarea
                id="instructions"
                rows={2}
                className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-transparent text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] placeholder:text-muted-foreground resize-none"
                placeholder="Code d'entrée, instructions particulières…"
                {...register("instructions")}
              />
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Traitement…
                </>
              ) : (
                confirmLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
