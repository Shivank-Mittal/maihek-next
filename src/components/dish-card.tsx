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
            Off the Menu Today
          </span>
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start gap-3">
          {dish.image ? (
            <img
              src={dish.image}
              alt={dish.name}
              className="w-14 h-14 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center text-2xl shrink-0">
              {getCategoryEmoji(categoryName)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-base font-semibold text-stone-800 leading-snug">{dish.name}</h3>
              {dish.discount && dish.discount.percentage > 0 && (
                <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  -{dish.discount.percentage}%
                </span>
              )}
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">{dish.description}</p>
            {dish.includes && dish.includes.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {dish.includes.map((item, index) => (
                  <li
                    key={index}
                    className="text-xs text-stone-400 bg-stone-50 border border-stone-100 px-2 py-0.5 rounded-full"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex justify-between items-center mt-4">
              <div className={`${isDisabled ? "text-stone-300" : "text-stone-800"}`}>
                {hasDishDiscount ? (
                  <div className="flex flex-col">
                    <span className="text-xs text-stone-400 line-through">
                      €{pricing.unitBasePrice.toFixed(2)}
                    </span>
                    <span className="text-lg font-bold">€{pricing.unitTotal.toFixed(2)}</span>
                  </div>
                ) : (
                  <span className="text-lg font-bold">€{pricing.unitBasePrice.toFixed(2)}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  className="decrease-qty w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg font-medium"
                  onClick={handleDecrement}
                  disabled={quantity === 0 || isDisabled}
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-semibold text-stone-700 qty-display">
                  {quantity}
                </span>
                <button
                  className="increase-qty w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg font-medium"
                  onClick={handleIncrement}
                  disabled={isDisabled}
                >
                  +
                </button>
                <button
                  className="add-to-cart ml-1.5 bg-stone-900 text-white text-sm px-4 py-2 rounded-full hover:bg-stone-700 transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed font-medium"
                  onClick={handleAddToCart}
                  disabled={quantity === 0 || isDisabled}
                >
                  Add To Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
