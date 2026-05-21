"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ADD_ONS, AddOnRow, MAX_ADDONS } from "@/components/addons-step";
import type { CartLineItem } from "@/hooks/use-cart";

type AddonPickerDialogProps = {
  open: boolean;
  dishName: string;
  enabledAddonIds?: string[];
  onConfirm: (addons: CartLineItem[]) => void;
  onClose: () => void;
};

export default function AddonPickerDialog({
  open,
  dishName,
  enabledAddonIds,
  onConfirm,
  onClose,
}: AddonPickerDialogProps) {
  const visibleAddons = enabledAddonIds
    ? ADD_ONS.filter((a) => enabledAddonIds.includes(a.id))
    : ADD_ONS;
  const [qtyMap, setQtyMap] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (open) setQtyMap(new Map());
  }, [open]);

  const totalSelected = visibleAddons.reduce((s, a) => s + (qtyMap.get(a.id) ?? 0), 0);
  const atLimit = totalSelected >= MAX_ADDONS;

  const handleAdd = (addon: (typeof ADD_ONS)[number]) => {
    setQtyMap((prev) => {
      const next = new Map(prev);
      next.set(addon.id, (next.get(addon.id) ?? 0) + 1);
      return next;
    });
  };

  const handleRemove = (id: string) => {
    setQtyMap((prev) => {
      const next = new Map(prev);
      const current = next.get(id) ?? 0;
      if (current <= 1) next.delete(id);
      else next.set(id, current - 1);
      return next;
    });
  };

  const buildAddons = (): CartLineItem[] =>
    visibleAddons.filter((a) => (qtyMap.get(a.id) ?? 0) > 0).map((a) => ({
      id: a.id,
      name: a.name,
      price: a.price,
      quantity: qtyMap.get(a.id)!,
    }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm max-h-[90dvh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-stone-100 shrink-0">
          <DialogTitle className="text-base font-semibold text-stone-800">
            Des extras pour votre {dishName} ?
          </DialogTitle>
          <p className="text-xs text-stone-400 mt-0.5">Maximum {MAX_ADDONS} extras</p>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-5 py-2">
          {atLimit && (
            <p className="text-xs text-stone-400 text-center py-2">
              Maximum de {MAX_ADDONS} extras atteint
            </p>
          )}
          {visibleAddons.map((addon) => (
            <AddOnRow
              key={addon.id}
              addon={addon}
              onAdd={handleAdd}
              onRemove={handleRemove}
              cartQty={qtyMap.get(addon.id) ?? 0}
              atLimit={atLimit}
            />
          ))}
        </div>

        <div className="px-5 pb-6 pt-4 border-t border-stone-100 shrink-0 flex flex-col gap-2">
          <button
            onClick={() => onConfirm(buildAddons())}
            className="w-full py-2.5 rounded-xl bg-stone-800 text-white text-sm font-semibold hover:bg-stone-700 transition-colors"
          >
            Ajouter au panier
          </button>
          <button
            onClick={() => onConfirm([])}
            className="w-full py-2 rounded-xl text-stone-500 text-sm hover:text-stone-700 transition-colors"
          >
            Sans extras
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
