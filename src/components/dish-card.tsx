"use client";

import { useState } from "react";

type DishCardItem = {
  _id: string;
  name: string;
  price: number;
  description: string;
  active?: boolean;
  includes?: string[];
  image?: string;
};

type DishCardProps = {
  dish: DishCardItem;
  addToCart: (
    item: { _id: string; name: string; price: number; image?: string },
    quantity: number
  ) => void;
};

export default function DishCard({ dish, addToCart }: DishCardProps) {
  const [quantity, setQuantity] = useState(0);
  const isDisabled = dish.active === false;

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
        image: dish.image,
      },
      quantity
    );

    setQuantity(0);
  };

  return (
    <div className="relative bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
      {isDisabled && (
        <div className="absolute inset-0 bg-white/70 rounded-lg flex items-center justify-center z-10">
          <span className="bg-stone-900/90 text-stone-50 text-sm font-semibold px-4 py-2 rounded-full shadow-sm">
            Off the Menu Today
          </span>
        </div>
      )}
      <h3 className="text-xl font-semibold text-gray-800">{dish.name}</h3>
      <p className="text-gray-600 mt-2">{dish.description}</p>
      {dish.includes && dish.includes.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Included Items
          </h4>
          <ul className="list-disc list-inside text-gray-400 text-sm mt-2">
            {dish.includes.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-between items-center mt-4">
        <p className={`font-bold ${isDisabled ? "text-gray-400" : "text-black"}`}>€{dish.price}</p>
        <div className="flex items-center space-x-2">
          <button
            className="decrease-qty bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleDecrement}
            disabled={quantity === 0 || isDisabled}
          >
            -
          </button>
          <span className="text-gray-700 qty-display">{quantity}</span>
          <button
            className="increase-qty bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleIncrement}
            disabled={isDisabled}
          >
            +
          </button>
          <button
            className="add-to-cart bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAddToCart}
            disabled={quantity === 0 || isDisabled}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
