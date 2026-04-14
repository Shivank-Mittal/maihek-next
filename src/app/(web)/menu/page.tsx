"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import CartDrawer from "@/components/cart-drawer";
import DishCard from "@/components/dish-card";
import { listDishCategories } from "@/services/dishes-service";
import { useRestaurantStatus } from "@/hooks/use-restaurant-status";
import { getDiscountSettings } from "@/services/discount-settings-service";
import { DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS, getTakeawayDiscountSummary } from "@/lib/checkout";
import type { DishCategory, MenuDish } from "@repo-types/dishes";

export default function Menu() {
  const { addToCart, setIsDrawerOpen } = useCart();
  const { isOpen: isRestaurantOpen } = useRestaurantStatus();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<DishCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [takeawayNotice, setTakeawayNotice] = useState<string | null>(
    getTakeawayDiscountSummary(DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS)
  );

  const fetchMenuItems = async () => {
    try {
      const [categories, discountSettings] = await Promise.all([
        listDishCategories(),
        getDiscountSettings().catch(() => ({
          takeawayDiscount: DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS,
        })),
      ]);

      setMenuItems(categories);
      setTakeawayNotice(getTakeawayDiscountSummary(discountSettings.takeawayDiscount));
    } catch (error) {
      console.error("Error fetching menu items:", error);
      setError("Failed to load menu items. Displaying default menu.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    fetchMenuItems();
  }, []);

  if (!isClient) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-stone-50">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <svg
            className="animate-spin h-8 w-8 text-stone-400"
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
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-stone-500 text-sm font-medium tracking-wide">Loading Menu…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen grid grid-cols-[200px_1fr_400px] gap-4">
      {/* Left sidebar — category nav */}
      <div className="hidden xl:flex h-screen sticky top-0 bg-white border-r border-stone-100 overflow-y-auto">
        <div className="px-6 pt-8 pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-5">
            Categories
          </p>
          <ul className="space-y-1">
            {menuItems.map((category) => (
              <li key={category._id}>
                <a
                  href={`#${category._id}`}
                  className="block text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 px-3 py-2 rounded-lg transition-colors duration-150 category-link"
                >
                  {category.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main content */}
      <div className="w-full px-4 sm:px-8 py-10">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400 mb-3">
            Restaurant Maihak
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-stone-900 tracking-tight">
            Notre Menu
          </h1>
          <div className="mt-3 w-12 h-0.5 bg-stone-300 mx-auto rounded-full" />
        </div>

        {!isRestaurantOpen && (
          <div className="mx-auto mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-3.5 text-center text-sm font-medium text-red-700">
            Le restaurant est actuellement fermé — vous pouvez consulter le menu mais les commandes
            ne sont pas disponibles pour le moment.
          </div>
        )}

        {takeawayNotice && (
          <div className="mx-auto mb-10 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-3.5 text-center text-sm font-medium text-emerald-700">
            {takeawayNotice}
          </div>
        )}

        {error && (
          <motion.p
            className="text-red-400 text-center mb-8 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {error}
          </motion.p>
        )}

        <div className="space-y-14">
          {menuItems.length > 0 &&
            menuItems.map((category) => (
              <CategoryBlock
                key={category._id}
                _id={category._id}
                title={category.name}
                dishes={category.dishes || []}
                restaurantClosed={!isRestaurantOpen}
                addToCart={(item, quantity) => {
                  addToCart({ ...item, id: item._id }, quantity);
                  toast.success(`${item.name} added to cart!`, {
                    duration: 2000,
                    style: {
                      background: "#1c1917",
                      color: "#fafaf9",
                      border: "1px solid #44403c",
                    },
                  });
                  setTimeout(() => setIsDrawerOpen(true), 100);
                }}
              />
            ))}
        </div>
      </div>

      <CartDrawer menuCategories={menuItems} />
    </div>
  );
}

const CategoryBlock = ({
  _id,
  dishes,
  title,
  restaurantClosed,
  addToCart,
}: {
  _id: string;
  title: string;
  dishes: MenuDish[];
  restaurantClosed?: boolean;
  addToCart: (
    item: {
      _id: string;
      name: string;
      price: number;
      basePrice?: number;
      image?: string;
      category?: string;
      dishDiscount?: MenuDish["discount"];
    },
    quantity: number
  ) => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-4 mb-5" id={_id}>
        <h2 className="text-xl font-bold text-stone-800 whitespace-nowrap">{title}</h2>
        <div className="flex-1 h-px bg-stone-200" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dishes.map((dish) => (
          <DishCard
            key={dish._id}
            dish={dish}
            categoryName={title}
            restaurantClosed={restaurantClosed}
            addToCart={addToCart}
          />
        ))}
      </div>
    </motion.div>
  );
};
