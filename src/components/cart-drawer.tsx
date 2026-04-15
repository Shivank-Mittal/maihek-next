"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Tag, Clock } from "lucide-react";
import { useCart, type CartItem } from "@/hooks/use-cart";
import { getItemEmoji } from "@/lib/food-emojis";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import UpsellModal from "@/components/upsell-modal";
import type { DishCategory } from "@repo-types/dishes";
import {
  DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS,
  DELIVERY_MINIMUM_ORDER_AMOUNT,
  calculateCartItemPricing,
  calculateCartPricing,
  getTakeawayDiscountSummary,
} from "@/lib/checkout";
import { getDiscountSettings } from "@/services/discount-settings-service";
import { useRestaurantStatus } from "@/hooks/use-restaurant-status";
import type { DiscountSettingsResponse } from "@repo-types/discounts";

type OrderType = "emporter" | "livraison";


function CartItemImage({ item, className }: { item: CartItem; className: string }) {
  if (item.image) {
    return <img src={item.image} alt={item.name} className={className} />;
  }
  return (
    <div
      className={`${className} bg-stone-50 border border-stone-100 flex items-center justify-center text-xl shrink-0`}
    >
      {item.emoji ?? getItemEmoji(item.id, item.category)}
    </div>
  );
}

type CartDrawerProps = {
  menuCategories?: DishCategory[];
};

export default function CartDrawer({ menuCategories = [] }: CartDrawerProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart, isDrawerOpen, setIsDrawerOpen } = useCart();
  const { isOpen: isRestaurantOpen } = useRestaurantStatus();

  const [loading, setLoading] = useState(false);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>("emporter");
  const [isCOD, setIsCOD] = useState(false);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [discountSettings, setDiscountSettings] = useState<DiscountSettingsResponse>({
    takeawayDiscount: DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS,
  });

  const pricingSummary = calculateCartPricing(cart, {
    orderType,
    takeawayDiscount: discountSettings.takeawayDiscount,
  });
  const totalAmount = pricingSummary.total;
  const takeawayNotice = getTakeawayDiscountSummary(discountSettings.takeawayDiscount);

  useEffect(() => {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    setTotalItems(total);
  }, [cart]);

  useEffect(() => {
    getDiscountSettings()
      .then(setDiscountSettings)
      .catch(() => {
        setDiscountSettings({ takeawayDiscount: DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS });
      });
  }, []);


  const handleUpdateQuantity = useCallback(
    (id: string | number, newQuantity: number) => {
      if (newQuantity >= 0) {
        updateQuantity(id.toString(), newQuantity);
        toast.success("Updated quantity for item", {
          duration: 2000,
          style: {
            background: "#15803d",
            color: "#fff",
            border: "1px solid #16a34a",
          },
        });
      }
    },
    [updateQuantity]
  );

  const handleRemoveFromCart = useCallback(
    (id: string | number, name: string) => {
      removeFromCart(id.toString());
      toast.success(`Removed ${name} from cart`, {
        duration: 2000,
        style: {
          background: "#15803d",
          color: "#fff",
          border: "1px solid #16a34a",
        },
      });
    },
    [removeFromCart]
  );

  const handleOrderTypeChange = useCallback(
    (value: OrderType) => {
      setOrderType(value);
    },
    []
  );

  const handleCheckout = useCallback(async () => {
    try {
      setLoading(true);

      if (cart.length === 0) {
        toast.error("Your cart is empty", {
          duration: 2000,
          style: {
            background: "#15803d",
            color: "#fff",
            border: "1px solid #16a34a",
          },
        });
        return;
      }

      setShowUpsellModal(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message, {
        duration: 3000,
        style: {
          background: "#7f1d1d",
          color: "#fff",
          border: "1px solid #dc2626",
        },
      });
    } finally {
      setLoading(false);
    }
  }, [cart.length, orderType, router, totalAmount]);

  return (
    <div>
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="xl:hidden bottom-20 right-4 z-50 bg-black text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
      >
        <ShoppingCart className="h-5 w-5" />

        {totalItems > 0 && cart.length > 0 && (
          <span
            id="cartCount"
            className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-semibold rounded-full h-6 w-6 flex items-center justify-center"
          >
            {totalItems}
          </span>
        )}
      </button>

      <div className="hidden xl:flex xl:flex-col w-[22%] bg-white border-l border-stone-100 fixed right-0 h-screen">
        <div className="px-5 pt-7 pb-4 border-b border-stone-100">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-1">
            Your Order
          </p>
          <h2 className="text-lg font-bold text-stone-900">Cart</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-hidden space-y-3">
          {cart.length === 0 && (
            <p className="text-sm text-stone-400 text-center mt-10">Your cart is empty.</p>
          )}
          {cart.map((item) => {
            const pricing = calculateCartItemPricing(item, {
              orderType,
              takeawayDiscount: discountSettings.takeawayDiscount,
            });

            return (
              <div key={item.id} className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl">
                <CartItemImage item={item} className="w-12 h-12 object-cover rounded-lg shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="cart-item-heading text-sm font-semibold text-stone-800 truncate">
                    {item.name}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {pricing.lineDiscount > 0 ? (
                      <>
                        <span className="line-through">EUR {pricing.unitBasePrice.toFixed(2)}</span>
                        <span className="ml-1.5 text-emerald-600 font-medium">
                          EUR {pricing.unitTotal.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <>EUR {pricing.unitBasePrice.toFixed(2)}</>
                    )}
                  </p>
                  {pricing.lineDiscount > 0 && (
                    <p className="mt-0.5 text-xs text-emerald-600">
                      -{pricing.appliedDiscountLabels.join(" + ")} −EUR{" "}
                      {pricing.lineDiscount.toFixed(2)}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      className="decreaseQty w-6 h-6 flex items-center justify-center rounded-full bg-stone-200 text-stone-600 hover:bg-stone-300 text-sm transition-colors"
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="text-sm font-semibold text-stone-700">{item.quantity}</span>
                    <button
                      className="increaseQty w-6 h-6 flex items-center justify-center rounded-full bg-stone-200 text-stone-600 hover:bg-stone-300 text-sm transition-colors"
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                    <button
                      className="removeItem ml-auto text-xs text-stone-400 hover:text-red-500 transition-colors"
                      onClick={() => handleRemoveFromCart(item.id, item.name)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <p className="text-sm font-semibold text-stone-800 shrink-0">
                  EUR {pricing.lineTotal.toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>

        <div className="px-5 py-5 border-t border-stone-100 space-y-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-3">
              Order type
            </p>
            <div className="flex gap-3">
              {(["emporter", "livraison"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleOrderTypeChange(type)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                    orderType === type
                      ? "bg-stone-900 text-white border-stone-900"
                      : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                  }`}
                >
                  {type === "emporter" ? "Take away" : "Delivery"}
                </button>
              ))}
            </div>
            {orderType === "emporter" && takeawayNotice && (
              <p className="mt-2 text-xs text-emerald-600">{takeawayNotice}</p>
            )}
            {orderType === "livraison" && (
              <p className="mt-2 text-xs text-amber-600">
                {pricingSummary.deliveryCharge > 0
                  ? `+${pricingSummary.deliveryCharge.toFixed(2)} € frais de livraison (gratuit dès ${DELIVERY_MINIMUM_ORDER_AMOUNT} €)`
                  : `Livraison gratuite à partir de ${DELIVERY_MINIMUM_ORDER_AMOUNT} €`}
              </p>
            )}
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-stone-500">
              <span>Subtotal</span>
              <span id="cart-total-desktop">EUR {pricingSummary.subtotal.toFixed(2)}</span>
            </div>
            {pricingSummary.dishDiscountTotal > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Item discounts</span>
                <span>−EUR {pricingSummary.dishDiscountTotal.toFixed(2)}</span>
              </div>
            )}
            {pricingSummary.takeawayDiscountTotal > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Takeaway discount</span>
                <span>−EUR {pricingSummary.takeawayDiscountTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-stone-900 pt-1 border-t border-stone-100">
              <span>Total</span>
              <span>EUR {pricingSummary.total.toFixed(2)}</span>
            </div>
          </div>

          {!isRestaurantOpen && (
            <p className="text-xs text-red-500 text-center">
              Le restaurant est fermé — les commandes ne sont pas disponibles.
            </p>
          )}
          <button
            id="checkoutButtonDesktop"
            className="w-full bg-stone-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-stone-700 transition-colors duration-200 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed"
            onClick={handleCheckout}
            disabled={loading || cart.length === 0 || !isRestaurantOpen}
          >
            {loading ? "Loading…" : "Proceed to Checkout"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isDrawerOpen && isMobile && (
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div
              className="absolute"
              onClick={() => setIsDrawerOpen(false)}
              aria-label="Close cart drawer"
            />
            <div className="h-full max-w-md ml-auto bg-white shadow-lg border-l border-gray-200">
              <div className="flex flex-col h-full justify-between">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                    <ShoppingCart className="h-6 w-6" />
                    Votre panier
                  </h2>
                </div>

                <div className="flex-1 p-6 overflow-y-auto scrollbar-hidden">
                  {cart.length === 0 ? (
                    <p className="text-center text-gray-500 text-lg">Votre panier est vide.</p>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item: CartItem) => {
                        const pricing = calculateCartItemPricing(item, {
                          orderType,
                          takeawayDiscount: discountSettings.takeawayDiscount,
                        });

                        return (
                          <motion.div
                            key={item.id}
                            className="flex items-center p-4 bg-gray-50 rounded-lg"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                            <CartItemImage item={item} className="w-16 h-16 object-cover rounded mr-4" />
                            <div className="flex-1">
                              <h3 className="text-base font-medium text-gray-900">{item.name}</h3>
                              <p className="text-sm text-gray-500">
                                {pricing.lineDiscount > 0 ? (
                                  <>
                                    <span className="line-through">
                                      EUR {pricing.unitBasePrice.toFixed(2)}
                                    </span>
                                    <span className="ml-2 font-medium text-emerald-700">
                                      EUR {pricing.unitTotal.toFixed(2)}
                                    </span>
                                  </>
                                ) : (
                                  <>EUR {pricing.unitBasePrice.toFixed(2)}</>
                                )}
                              </p>
                              {pricing.lineDiscount > 0 && (
                                <p className="mt-1 text-xs text-emerald-700">
                                  {pricing.appliedDiscountLabels.join(" + ")} : -EUR{" "}
                                  {pricing.lineDiscount.toFixed(2)}
                                </p>
                              )}
                              <div className="flex items-center mt-2">
                                <motion.button
                                  className="text-gray-500 hover:text-gray-700 cursor-pointer"
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  aria-label={`Decrease quantity of ${item.name}`}
                                >
                                  -
                                </motion.button>
                                <span className="mx-2 text-sm font-medium">{item.quantity}</span>
                                <motion.button
                                  className="text-gray-500 hover:text-gray-700 cursor-pointer"
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  aria-label={`Increase quantity of ${item.name}`}
                                >
                                  +
                                </motion.button>
                                <motion.button
                                  className="ml-4 text-red-500 hover:text-red-700"
                                  onClick={() => handleRemoveFromCart(item.id, item.name)}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  aria-label={`Remove ${item.name} from cart`}
                                >
                                  Supprimer
                                </motion.button>
                              </div>
                            </div>
                            <p className="text-sm font-semibold text-gray-900 text-right">
                              EUR {pricing.lineTotal.toFixed(2)}
                            </p>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-gray-200">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Type de commande</h3>
                    <div className="flex flex-col gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                        <input
                          type="radio"
                          name="order-type-mobile"
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                          checked={orderType === "emporter"}
                          onChange={() => handleOrderTypeChange("emporter")}
                        />
                        A emporter
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                        <input
                          type="radio"
                          name="order-type-mobile"
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                          checked={orderType === "livraison"}
                          onChange={() => handleOrderTypeChange("livraison")}
                        />
                        Livraison
                      </label>
                    </div>
                    {orderType === "livraison" && (
                      <p className="mt-3 text-sm text-amber-600">
                        {pricingSummary.deliveryCharge > 0
                          ? `+${pricingSummary.deliveryCharge.toFixed(2)} € frais de livraison (gratuit dès ${DELIVERY_MINIMUM_ORDER_AMOUNT} €)`
                          : `Livraison gratuite à partir de ${DELIVERY_MINIMUM_ORDER_AMOUNT} €`}
                      </p>
                    )}
                    {orderType === "emporter" && takeawayNotice && (
                      <p className="mt-3 text-sm text-emerald-700">{takeawayNotice}</p>
                    )}
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Methode de paiement
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                        <input
                          type="radio"
                          name="payment-method-mobile"
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                          checked={!isCOD}
                          onChange={() => setIsCOD(false)}
                        />
                        Paiement en ligne
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                        <input
                          type="radio"
                          name="payment-method-mobile"
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                          checked={isCOD}
                          onChange={() => setIsCOD(true)}
                        />
                        Paiement a la livraison
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-medium text-gray-900">Sous-total</span>
                    <span className="text-lg font-semibold text-gray-900">
                      EUR {pricingSummary.subtotal.toFixed(2)}
                    </span>
                  </div>
                  {pricingSummary.dishDiscountTotal > 0 && (
                    <div className="flex justify-between items-center mb-4 text-emerald-700">
                      <span className="text-lg font-medium">Remises article</span>
                      <span className="text-lg font-semibold">
                        -EUR {pricingSummary.dishDiscountTotal.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {pricingSummary.takeawayDiscountTotal > 0 && (
                    <div className="flex justify-between items-center mb-4 text-emerald-700">
                      <span className="text-lg font-medium">Remise a emporter</span>
                      <span className="text-lg font-semibold">
                        -EUR {pricingSummary.takeawayDiscountTotal.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-medium text-gray-900">Total</span>
                    <span className="text-lg font-semibold text-gray-900">
                      EUR {pricingSummary.total.toFixed(2)}
                    </span>
                  </div>

                  {!isRestaurantOpen && (
                    <p className="mb-3 text-sm text-red-600 text-center">
                      Le restaurant est fermé — les commandes ne sont pas disponibles.
                    </p>
                  )}
                  <motion.button
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || loading || !isRestaurantOpen}
                    className={`w-full py-3 rounded-lg font-medium transition duration-300 flex items-center justify-center gap-2 ${
                      cart.length === 0 || loading || !isRestaurantOpen
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-600 hover:from-indigo-700 to-purple-600 hover:to-purple-700 text-white"
                    }`}
                    whileHover={{ scale: cart.length === 0 || loading ? 1 : 1.03 }}
                    whileTap={{ scale: cart.length === 0 || loading ? 1 : 0.97 }}
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 text-white"
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
                        Chargement...
                      </>
                    ) : (
                      "Passer a la caisse"
                    )}
                  </motion.button>
                  <motion.button
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-full mt-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium transition duration-200"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Fermer
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <UpsellModal
        open={showUpsellModal}
        menuCategories={menuCategories}
        onClose={() => setShowUpsellModal(false)}
        onConfirm={() => {
          setShowUpsellModal(false);
          setIsDrawerOpen(false);
          router.push(`/checkout?orderType=${orderType}`);
        }}
      />
    </div>
  );
}
