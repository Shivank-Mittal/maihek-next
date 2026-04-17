"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ChevronRight, ChevronLeft } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { ADDON_EMOJI } from "@/lib/food-emojis";
import type { DishCategory, MenuDish } from "@repo-types/dishes";

// ─── Hardcoded add-ons ───────────────────────────────────────────────────────

type AddOn = {
  id: string;
  name: string;
  price: number;
};

const ADD_ONS: AddOn[] = [
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

// ─── Category name matchers ──────────────────────────────────────────────────

const RICE_CATEGORY_NAMES = ["riz basmati", "side dishes", "rice", "riz"];
const BREAD_CATEGORY_NAMES = ["pains", "pain", "breads", "bread"];

const matchesCategory = (name: string, targets: string[]) =>
  targets.includes(name.toLowerCase().trim());

// ─── Types ───────────────────────────────────────────────────────────────────

type UpsellModalProps = {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
  menuCategories: DishCategory[];
};

type Step = "dishes" | "addons";

// ─── Dish row ────────────────────────────────────────────────────────────────

function DishRow({
  dish,
  categoryName,
  onAdd,
  onRemove,
  cartQty,
}: {
  dish: MenuDish;
  categoryName: string;
  onAdd: (dish: MenuDish, categoryName: string) => void;
  onRemove: (id: string) => void;
  cartQty: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-stone-100 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        {dish.image && (
          <img
            src={dish.image}
            alt={dish.name}
            className="w-10 h-10 rounded-lg object-cover shrink-0"
          />
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-stone-800 truncate">{dish.name}</p>
          <p className="text-xs text-stone-400">€{dish.price.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          className="w-7 h-7 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 disabled:opacity-30 transition-colors"
          onClick={() => onRemove(dish._id)}
          disabled={cartQty === 0}
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-5 text-center text-sm font-semibold text-stone-700">{cartQty}</span>
        <button
          className="w-7 h-7 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
          onClick={() => onAdd(dish, categoryName)}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Add-on row ──────────────────────────────────────────────────────────────

function AddOnRow({
  addon,
  onAdd,
  onRemove,
  cartQty,
}: {
  addon: AddOn;
  onAdd: (addon: AddOn) => void;
  onRemove: (id: string) => void;
  cartQty: number;
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
          className="w-7 h-7 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
          onClick={() => onAdd(addon)}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Main modal ──────────────────────────────────────────────────────────────

export default function UpsellModal({
  open,
  onConfirm,
  onClose,
  menuCategories,
}: UpsellModalProps) {
  const { cart, addToCart, updateQuantity } = useCart();
  const [step, setStep] = useState<Step>("dishes");

  // Reset to first step whenever modal opens
  useEffect(() => {
    if (open) setStep("dishes");
  }, [open]);

  // Prevent background scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const cartQtyMap = new Map(cart.map((item) => [item.id, item.quantity]));

  const riceCategory = menuCategories.find((c) => matchesCategory(c.name, RICE_CATEGORY_NAMES));
  const breadCategory = menuCategories.find((c) => matchesCategory(c.name, BREAD_CATEGORY_NAMES));

  const riceDishes = (riceCategory?.dishes ?? []).filter((d) => d.active !== false);
  const breadDishes = (breadCategory?.dishes ?? []).filter((d) => d.active !== false);

  const hasDishes = riceDishes.length > 0 || breadDishes.length > 0;

  const handleAddDish = (dish: MenuDish, categoryName: string) => {
    addToCart(
      {
        id: dish._id,
        name: dish.name,
        price: dish.price,
        basePrice: dish.price,
        image: dish.image,
        category: categoryName,
        dishDiscount: dish.discount ?? null,
      },
      1
    );
  };

  const handleRemoveDish = (id: string) => {
    const qty = cartQtyMap.get(id) ?? 0;
    updateQuantity(id, qty - 1);
  };

  const handleAddAddon = (addon: AddOn) => {
    addToCart(
      {
        id: addon.id,
        name: addon.name,
        price: addon.price,
        basePrice: addon.price,
        category: "Extras",
        emoji: ADDON_EMOJI[addon.id],
      },
      1
    );
  };

  const handleRemoveAddon = (id: string) => {
    const qty = cartQtyMap.get(id) ?? 0;
    updateQuantity(id, qty - 1);
  };

  const stepConfig = {
    dishes: {
      eyebrow: "Étape 1 sur 2",
      title: "Ajoutez des accompagnements à votre commande",
    },
    addons: {
      eyebrow: "Étape 2 sur 2",
      title: "Des extras ?",
    },
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel — full screen on mobile, centered dialog on desktop */}
          <motion.div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div
              className="bg-white w-full h-full md:h-auto md:max-w-lg md:rounded-2xl md:max-h-[90dvh] flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100 shrink-0">
                <div className="flex items-center gap-2">
                  {step === "addons" && (
                    <button
                      onClick={() => setStep("dishes")}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-0.5">
                      {stepConfig[step].eyebrow}
                    </p>
                    <h2 className="text-lg font-bold text-stone-900">{stepConfig[step].title}</h2>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step indicator */}
              <div className="flex gap-1.5 px-5 pt-3 shrink-0">
                {(["dishes", "addons"] as Step[]).map((s) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      step === s ? "bg-stone-900" : "bg-stone-200"
                    }`}
                  />
                ))}
              </div>

              {/* Scrollable content — animated between steps */}
              <div className="overflow-y-auto flex-1 px-5 py-4 scrollbar-hidden">
                <AnimatePresence mode="wait">
                  {step === "dishes" ? (
                    <motion.div
                      key="dishes"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {!hasDishes && (
                        <p className="text-sm text-stone-400 text-center py-8">
                          Tous les accompagnements et pains sont déjà dans votre panier.
                        </p>
                      )}

                      {riceDishes.length > 0 && (
                        <section>
                          <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">
                            Accompagnements
                          </h3>
                          {riceDishes.map((dish) => (
                            <DishRow
                              key={dish._id}
                              dish={dish}
                              categoryName={riceCategory!.name}
                              onAdd={handleAddDish}
                              onRemove={handleRemoveDish}
                              cartQty={cartQtyMap.get(dish._id) ?? 0}
                            />
                          ))}
                        </section>
                      )}

                      {breadDishes.length > 0 && (
                        <section>
                          <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">
                            Pains
                          </h3>
                          {breadDishes.map((dish) => (
                            <DishRow
                              key={dish._id}
                              dish={dish}
                              categoryName={breadCategory!.name}
                              onAdd={handleAddDish}
                              onRemove={handleRemoveDish}
                              cartQty={cartQtyMap.get(dish._id) ?? 0}
                            />
                          ))}
                        </section>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="addons"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      {ADD_ONS.map((addon) => (
                        <AddOnRow
                          key={addon.id}
                          addon={addon}
                          onAdd={handleAddAddon}
                          onRemove={handleRemoveAddon}
                          cartQty={cartQtyMap.get(addon.id) ?? 0}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-5 pb-6 pt-4 border-t border-stone-100 shrink-0 flex flex-col gap-2.5">
                {step === "dishes" ? (
                  <>
                    <button
                      onClick={() => setStep("addons")}
                      className="w-full bg-stone-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-stone-700 transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      Suivant : Extras
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={onConfirm}
                      className="w-full py-2.5 rounded-xl text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors"
                    >
                      Passer et payer
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={onConfirm}
                      className="w-full bg-stone-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-stone-700 transition-colors duration-200"
                    >
                      Continuer vers le paiement
                    </button>
                    <button
                      onClick={onConfirm}
                      className="w-full py-2.5 rounded-xl text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors"
                    >
                      Passer
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
