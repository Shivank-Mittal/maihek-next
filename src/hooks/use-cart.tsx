// 'use client';

// import React, { createContext, useState, useContext, useEffect } from 'react';

// // Create Context
// const CartContext = createContext();

// // Cart Provider
// export const CartProvider = ({ children }) => {
//   const [cart, setCart] = useState([]);
//   const [location, setLocation] = useState(null);
//   const [isDrawerOpen, setIsDrawerOpen] = useState(false);

//   // Load cart from localStorage on first render
//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       const storedCart = localStorage.getItem('cartItems');
//       if (storedCart) {
//         setCart(JSON.parse(storedCart));
//       }
//     }
//   }, []);

//   // Save cart to localStorage whenever it changes
//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       localStorage.setItem('cartItems', JSON.stringify(cart));
//     }
//   }, [cart]);

//   // Add item to cart (Update quantity if exists)
//   const addToCart = (item, quantity) => {
//     console.log(item, 'item');
//     setCart((prevCart) => {
//       const existingItem = prevCart.find(
//         (cartItem) => cartItem.id === item.id && cartItem.option === item.option
//       );
//       console.log(existingItem, 'existingItem');
//       if (existingItem) {
//         return prevCart.map((cartItem) =>
//           cartItem.id === item.id && cartItem.option === item.option
//             ? { ...cartItem, quantity: cartItem.quantity + quantity }
//             : cartItem
//         );
//       }

//       return [...prevCart, { ...item, quantity }];
//     });
//   };

//   // Remove item from cart
//   const removeFromCart = (itemId) => {
//     setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
//   };

//   // Clear cart
//   const clearCart = () => {
//     setCart([]);
//   };

//   // Get total price (needed for checkout page)
//   const getTotal = () => {
//     return cart.reduce((total, item) => total + item.price * (item.quantity || 1), 0).toFixed(2);
//   };

//   const updateQuantity = (itemId, newQuantity) => {
//     setCart((prevCart) =>
//       prevCart.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item))
//     );
//   };

//   return (
//     <CartContext.Provider
//       value={{
//         cart,
//         addToCart,
//         removeFromCart,
//         clearCart,
//         getTotal,
//         location,
//         setLocation,
//         isDrawerOpen,
//         setIsDrawerOpen,
//         updateQuantity,
//       }}
//     >
//       {children}
//     </CartContext.Provider>
//   );
// };

// // Custom Hook for using CartContext
// export const useCart = () => useContext(CartContext);
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { toast } from "sonner"; // Optional: Remove if not using sonner

// Define cart item interface (matches checkout page and /api/send-email)
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  option?: string;
  selectedItems?: Record<string, string>;
  image?: string;
}

// Define location interface (optional, adjust as needed)
interface Location {
  city?: string;
  [key: string]: any; // Flexible for unspecified fields
}

// Define context shape
interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  getTotal: () => string;
  location: Location | null;
  setLocation: React.Dispatch<React.SetStateAction<Location | null>>;
  isDrawerOpen: boolean;
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  updateQuantity: (itemId: string, newQuantity: number) => void;
}

// Create Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Custom Hook for using CartContext
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

// Cart Provider
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Load cart from localStorage on first render
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedCart = localStorage.getItem("cartItems");
        if (storedCart) {
          setCart(JSON.parse(storedCart));
        }
      } catch (error) {
        console.error("Error parsing cart from localStorage:", error);
        toast.error("Failed to load cart."); // Optional: Remove if not using sonner
        setCart([]);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("cartItems", JSON.stringify(cart));
      } catch (error) {
        console.error("Error saving cart to localStorage:", error);
        toast.error("Failed to save cart."); // Optional: Remove if not using sonner
      }
    }
  }, [cart]);

  // Add item to cart (Update quantity if exists)
  const addToCart = (item: Omit<CartItem, "quantity">, quantity: number) => {
    console.log(item, quantity);
    console.log(item, "item");
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (cartItem) => cartItem.id === item.id && cartItem.option === item.option
      );
      console.log(existingItem, "existingItem");
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id && cartItem.option === item.option
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      }

      return [...prevCart, { ...item, quantity }];
    });
    toast.success(`${item.name} added to cart!`); // Optional: Remove if not using sonner
  };

  // Remove item from cart
  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => {
      const item = prevCart.find((item) => item.id === itemId);
      if (item) {
        toast.success(`${item.name} removed from cart!`); // Optional: Remove if not using sonner
      }
      return prevCart.filter((item) => item.id !== itemId);
    });
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    toast.success("Cart cleared!"); // Optional: Remove if not using sonner
  };

  // Get total price (needed for checkout page)
  const getTotal = () => {
    return cart.reduce((total, item) => total + item.price * (item.quantity || 1), 0).toFixed(2);
  };

  // Update quantity
  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item))
    );
    toast.success("Quantity updated!"); // Optional: Remove if not using sonner
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        getTotal,
        location,
        setLocation,
        isDrawerOpen,
        setIsDrawerOpen,
        updateQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
