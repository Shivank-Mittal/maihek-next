"use client";

import { useState } from "react";
import { calculateCartItemPricing } from "@/lib/checkout";
import { getCategoryEmoji } from "@/lib/food-emojis";
import type { DishDiscount, MenuDish } from "@repo-types/dishes";

type DishCardProps = {
  dish: MenuDish;
  categoryName: string;
  restaurantClosed?: boolean;
  addToCart: (
    item: {
      _id: string;
      name: string;
      price: number;
      basePrice?: number;
      image?: string;
      category?: string;
      dishDiscount?: DishDiscount | null;
    },
    quantity: number
  ) => void;
};

export default function DishCard({
  dish,
  categoryName,
  restaurantClosed,
  addToCart,
}: DishCardProps) {
  const [quantity, setQuantity] = useState(0);
  const isDisabled = dish.active === false || restaurantClosed === true;
  const pricing = calculateCartItemPricing({
    price: dish.price,
    dishDiscount: dish.discount,
  });
  const hasDishDiscount = pricing.unitDishDiscount > 0;

  const handleIncrement = () => setQuantity((current) => current + 1);
  const handleDecrement = () => setQuantity((current) => Math.max(0, current - 1));

  const handleAddToCart = () => {
    if (quantity === 0) {
      return;
    }

    addToCart(
      {
        _id: dish._id,
        name: dish.name,
        price: dish.price,
        basePrice: dish.price,
        image: dish.image,
        category: categoryName,
        dishDiscount: dish.discount ?? null,
      },
      quantity
    );

    setQuantity(0);
  };

  return (
    <div className="relative bg-white rounded-2xl border border-stone-100 hover:border-stone-200 hover:shadow-md transition-all duration-300 overflow-hidden">
      {dish.active === false && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] rounded-2xl flex items-center justify-center z-10">
          <span className="bg-stone-800 text-stone-50 text-xs font-semibold px-4 py-2 rounded-full tracking-wide uppercase">
            Hors du menu aujourd'hui
          </span>
        </div>
      )}
      <div className="p-5">
        <div className="flex flex-col gap-4">
          {dish.image ? (
            <img
              src={dish.image}
              alt={dish.name}
              className="w-full h-44 rounded-[2rem] object-cover border border-stone-100 shadow-sm"
            />
          ) : (
            <div className="w-full h-44 rounded-[2rem] bg-stone-50 border border-stone-100 flex items-center justify-center text-4xl shadow-sm">
              {getCategoryEmoji(categoryName)}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h3 className="text-xl font-semibold text-stone-900 leading-tight">{dish.name}</h3>
              {dish.discount && dish.discount.percentage > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 text-xs font-semibold">
                  -{dish.discount.percentage}%
                </span>
              )}
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">{dish.description}</p>
            {dish.includes && dish.includes.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {dish.includes.map((item, index) => (
                  <li
                    key={index}
                    className="text-[11px] text-stone-500 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-full"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-3">
            <div className={`${isDisabled ? "text-stone-300" : "text-stone-800"}`}>
              {hasDishDiscount ? (
                <div className="space-y-1">
                  <span className="block text-xs text-stone-400 line-through">€{pricing.unitBasePrice.toFixed(2)}</span>
                  <span className="text-2xl font-bold">€{pricing.unitTotal.toFixed(2)}</span>
                </div>
              ) : (
                <span className="text-2xl font-bold">€{pricing.unitBasePrice.toFixed(2)}</span>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
              <div className="flex items-center gap-2 justify-between sm:justify-start">
                <button
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg font-medium"
                  onClick={handleDecrement}
                  disabled={quantity === 0 || isDisabled}
                >
                  −
                </button>
                <span className="w-9 text-center text-sm font-semibold text-stone-700 qty-display">{quantity}</span>
                <button
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg font-medium"
                  onClick={handleIncrement}
                  disabled={isDisabled}
                >
                  +
                </button>
              </div>

              <button
                className="w-full bg-stone-900 text-white text-sm px-4 py-3 rounded-full hover:bg-stone-700 transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed font-medium"
                onClick={handleAddToCart}
                disabled={quantity === 0 || isDisabled}
              >
                Ajouter au panier
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
