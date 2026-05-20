"use client";

import { Minus, Plus } from "lucide-react";
import { ADDON_EMOJI } from "@/lib/food-emojis";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AddOn = {
  id: string;
  name: string;
  price: number;
};

export const ADD_ONS: AddOn[] = [
  { id: "addon-chicken", name: "Poulet", price: 2 },
  { id: "addon-lamb", name: "Agneau", price: 2 },
  { id: "addon-shrimp", name: "Crevettes", price: 3 },
  { id: "addon-paneer", name: "Paneer", price: 0 },
  { id: "addon-extra-chicken", name: "Poulet supplémentaire", price: 2 },
  { id: "addon-extra-lamb", name: "Agneau supplémentaire", price: 2 },
  { id: "addon-extra-shrimp", name: "Crevettes supplémentaires", price: 3 },
  { id: "addon-extra-sauce", name: "Sauce supplémentaire", price: 1.5 },
  { id: "addon-extra-gravy", name: "Sauce supplémentaire", price: 1.5 },
  { id: "addon-potatoes", name: "Pommes de terre", price: 1 },
  { id: "addon-peas", name: "Pois", price: 1 },
  { id: "addon-mixed-veg", name: "Légumes mélangés", price: 1.5 },
  { id: "addon-extra-garlic", name: "Ail supplémentaire", price: 0.5 },
  { id: "addon-coriander", name: "Coriandre fraîche", price: 0.5 },
  { id: "addon-ginger", name: "Gingembre", price: 0.5 },
  { id: "addon-lemon", name: "Citron", price: 0.5 },
  { id: "addon-onions", name: "Oignons", price: 0.5 },
  { id: "addon-pickles", name: "Cornichons", price: 0.5 },
  { id: "addon-raita", name: "Raita", price: 1.5 },
  { id: "addon-fresh-cream", name: "Crème fraîche", price: 1.5 },
];

export const MAX_ADDONS = 2;

// ─── AddOnRow ────────────────────────────────────────────────────────────────

export function AddOnRow({
  addon,
  onAdd,
  onRemove,
  cartQty,
  atLimit,
}: {
  addon: AddOn;
  onAdd: (addon: AddOn) => void;
  onRemove: (id: string) => void;
  cartQty: number;
  atLimit: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-stone-100 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center text-xl shrink-0">
          {ADDON_EMOJI[addon.id]}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-stone-800">{addon.name}</p>
          <p className="text-xs text-stone-400">
            {addon.price === 0 ? "gratuit" : `+€${addon.price.toFixed(2)}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          className="w-7 h-7 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 disabled:opacity-30 transition-colors"
          onClick={() => onRemove(addon.id)}
          disabled={cartQty === 0}
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-5 text-center text-sm font-semibold text-stone-700">{cartQty}</span>
        <button
          className="w-7 h-7 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 disabled:opacity-30 transition-colors"
          onClick={() => onAdd(addon)}
          disabled={atLimit}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ─── AddonsStep ──────────────────────────────────────────────────────────────

export default function AddonsStep({
  cartQtyMap,
  onAdd,
  onRemove,
}: {
  cartQtyMap: Map<string, number>;
  onAdd: (addon: AddOn) => void;
  onRemove: (id: string) => void;
}) {
  const totalAddons = ADD_ONS.reduce((sum, a) => sum + (cartQtyMap.get(a.id) ?? 0), 0);
  const atLimit = totalAddons >= MAX_ADDONS;

  return (
    <>
      {atLimit && (
        <p className="text-xs text-stone-400 text-center mb-3">
          Maximum de {MAX_ADDONS} extras atteint
        </p>
      )}
      {ADD_ONS.map((addon) => (
        <AddOnRow
          key={addon.id}
          addon={addon}
          onAdd={onAdd}
          onRemove={onRemove}
          cartQty={cartQtyMap.get(addon.id) ?? 0}
          atLimit={atLimit}
        />
      ))}
    </>
  );
}
