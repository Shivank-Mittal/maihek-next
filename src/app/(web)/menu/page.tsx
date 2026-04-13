"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import CartDrawer from "@/components/cart-drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Category, Dish } from "./types";

export default function Menu() {
  const { addToCart, setIsDrawerOpen } = useCart();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<Category[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch("/api/v1/dishes");
      if (!response.ok) throw new Error("Failed to fetch menu items");
      const data = await response.json();
      console.log(data, "data");
      // Validate and normalize the fetched data
      const normalizedData = (data?.data || []).map((category: Category) => ({
        ...category,
        dishes: (category.dishes || []).map((dish: Dish) => ({
          ...dish,
          includes: Array.isArray(dish.includes) ? dish.includes : [],
        })),
      }));
      const uniqueCategories = data.data.map((category: Category) => {
        return {
          _id: category._id,
          name: category.name,
        };
      });
      console.log(uniqueCategories, "uniqueCategories");
      setCategories(uniqueCategories);
      setMenuItems(normalizedData.length > 0 ? normalizedData : []);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      setError("Failed to load menu items. Displaying default menu.");

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
      <div className="flex items-center justify-center h-screen w-full ">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <svg
            className="animate-spin h-10 w-10 text-gray-600"
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
          <p className="text-black text-lg font-semibold">Loading Menu...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen flex">
      <div className="hidden xl:block w-fit p-4 bg-white shadow-lg fixed h-screen overflow-y-auto">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 ">Menu Categories</h1>
          <ul className="space-y-4">
            {categories.length > 0 &&
              categories.map((category) => (
                <li key={category._id}>
                  <a
                    href={`#${category._id}`}
                    className="block text-lg font-semibold text-gray-700 hover:text-indigo-600 transition-colors duration-200 category-link"
                  >
                    {category.name}
                  </a>
                </li>
              ))}
          </ul>
        </div>
      </div>
      <div className="lg:ml-[20%] w-full lg:w-[60%] p-4 lg:p-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-center mb-16  ">
            Notre Menu Exquis
          </h1>
        </div>

        {error && (
          <motion.p
            className="text-red-400 text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {error}
          </motion.p>
        )}

        <div className="space-y-16">
          {menuItems.length > 0 &&
            menuItems.map((category) => (
              <CategoryBlock
                key={category._id}
                _id={category._id}
                title={category.name}
                dishes={category.dishes || []}
                addToCart={(item, quantity) => {
                  addToCart({ ...item, id: item._id }, quantity);
                  toast.success(`${item.name} added to cart!`, {
                    duration: 2000,
                    style: {
                      background: "#15803d",
                      color: "#fff",
                      border: "1px solid #16a34a",
                    },
                  });
                  setTimeout(() => setIsDrawerOpen(true), 100);
                }}
              />
            ))}
        </div>
      </div>
      <CartDrawer />
    </div>
  );
}

const DishCard = ({
  dish,
  isImageLeft,
  addToCart,
}: {
  dish: Dish;
  isImageLeft: boolean;
  addToCart: (
    item: { _id: string; name: string; price: number; image?: string },
    quantity: number
  ) => void;
}) => {
  const [quantity, setQuantity] = useState(0);
  const isMobile = useIsMobile();
  console.log(isMobile, "isMobile");
  const handleIncrement = () => setQuantity(quantity + 1);
  const handleDecrement = () => quantity > 0 && setQuantity(quantity - 1);

  const handleAddToCart = () => {
    if (quantity > 0) {
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
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
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
        <p className="text-black font-bold">€{dish.price}</p>
        <div className="flex items-center space-x-2">
          <button
            className="decrease-qty bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300"
            onClick={handleDecrement}
            disabled={quantity === 0}
          >
            -
          </button>
          <span className="text-gray-700 qty-display" data-id="4">
            {quantity}
          </span>
          <button
            className="increase-qty bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300"
            onClick={handleIncrement}
          >
            +
          </button>
          <button
            className="add-to-cart bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
            onClick={handleAddToCart} //images.unsplash.com/photo-1559847844-5315695dadae?w=300&h=200&fit=crop"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

const CategoryBlock = ({
  _id,
  dishes,
  title,
  addToCart,
}: {
  _id: string;
  title: string;
  dishes: Dish[];
  addToCart: (item: { _id: string; name: string; price: number }, quantity: number) => void;
}) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      <h2 className="text-3xl font-bold text-gray-800 mb-6" id={_id}>
        {title}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dishes.map((dish, index) => (
          <DishCard
            key={dish._id}
            dish={dish}
            isImageLeft={index % 2 === 0}
            addToCart={addToCart}
          />
        ))}
      </div>
    </motion.div>
  );
};
