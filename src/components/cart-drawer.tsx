"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { useCart, type CartItem } from "@/hooks/use-cart";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { DeliveryMinimumDialog } from "@/components/delivery-minimum-dialog";
import {
  DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS,
  DELIVERY_MINIMUM_ORDER_AMOUNT,
  calculateCartItemPricing,
  calculateCartPricing,
  getDeliveryMinimumMessage,
  getTakeawayDiscountSummary,
  isDeliveryMinimumMet,
} from "@/lib/checkout";
import { getDiscountSettings } from "@/services/discount-settings-service";
import type { DiscountSettingsResponse } from "@repo-types/discounts";

type OrderType = "emporter" | "livraison";

export default function CartDrawer() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart, isDrawerOpen, setIsDrawerOpen } = useCart();

  const [loading, setLoading] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>("emporter");
  const [isCOD, setIsCOD] = useState(false);
  const [showDeliveryMinimumDialog, setShowDeliveryMinimumDialog] = useState(false);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [discountSettings, setDiscountSettings] = useState<DiscountSettingsResponse>({
    takeawayDiscount: DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS,
  });

  const pricingSummary = calculateCartPricing(cart, {
    orderType,
    takeawayDiscount: discountSettings.takeawayDiscount,
  });
  const totalAmount = pricingSummary.total;
  const deliveryMinimumReached = isDeliveryMinimumMet(orderType, totalAmount);
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

  const openDeliveryMinimumDialog = useCallback(() => {
    setShowDeliveryMinimumDialog(true);
    toast.error(getDeliveryMinimumMessage("EUR"), {
      duration: 3000,
      style: {
        background: "#7f1d1d",
        color: "#fff",
        border: "1px solid #dc2626",
      },
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

      if (value === "livraison" && !isDeliveryMinimumMet(value, totalAmount)) {
        openDeliveryMinimumDialog();
      }
    },
    [openDeliveryMinimumDialog, totalAmount]
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

      if (!isDeliveryMinimumMet(orderType, totalAmount)) {
        openDeliveryMinimumDialog();
        return;
      }

      router.push(`/checkout?orderType=${orderType}`);
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
  }, [cart.length, openDeliveryMinimumDialog, orderType, router, totalAmount]);

  return (
    <div>
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="xl:hidden fixed bottom-20 right-4 z-50 bg-black text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
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

      <div className="hidden xl:block w-1/5 bg-white shadow-lg fixed right-0 h-screen">
        <div className="p-6 h-full flex flex-col justify-between">
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-hidden">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Cart</h2>
            <div id="cart-items-desktop" className="space-y-4">
              {cart.map((item) => {
                const pricing = calculateCartItemPricing(item, {
                  orderType,
                  takeawayDiscount: discountSettings.takeawayDiscount,
                });

                return (
                  <div key={item.id} className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded mr-4"
                    />
                    <div className="flex-1">
                      <h3 className="cart-item-heading text-base font-medium text-gray-900">
                        {item.name}
                      </h3>
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
                        <button
                          className="decreaseQty text-gray-500 hover:text-gray-700 cursor-pointer"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        >
                          -
                        </button>
                        <span className="mx-2 text-sm font-medium">{item.quantity}</span>
                        <button
                          className="increaseQty text-gray-500 hover:text-gray-700 cursor-pointer"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                        <button
                          className="removeItem ml-4 text-red-500 hover:text-red-700"
                          onClick={() => handleRemoveFromCart(item.id, item.name)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 text-right">
                      EUR {pricing.lineTotal.toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t pt-6 mt-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Order type</h3>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                  <input
                    type="radio"
                    name="order-type-desktop"
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    checked={orderType === "emporter"}
                    onChange={() => handleOrderTypeChange("emporter")}
                  />
                  Take away
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                  <input
                    type="radio"
                    name="order-type-desktop"
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    checked={orderType === "livraison"}
                    onChange={() => handleOrderTypeChange("livraison")}
                  />
                  Delivery
                </label>
              </div>
              {orderType === "emporter" && takeawayNotice && (
                <p className="mt-3 text-sm text-emerald-700">{takeawayNotice}</p>
              )}
              {!deliveryMinimumReached && orderType === "livraison" && (
                <p className="mt-3 text-sm text-red-600">
                  Delivery requires a minimum of {DELIVERY_MINIMUM_ORDER_AMOUNT} EUR.
                </p>
              )}
            </div>

            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-medium text-gray-900">Subtotal</span>
              <span id="cart-total-desktop" className="text-lg font-semibold text-gray-900">
                EUR {pricingSummary.subtotal.toFixed(2)}
              </span>
            </div>
            {pricingSummary.dishDiscountTotal > 0 && (
              <div className="flex justify-between items-center mb-4 text-emerald-700">
                <span className="text-lg font-medium">Item discounts</span>
                <span className="text-lg font-semibold">
                  -EUR {pricingSummary.dishDiscountTotal.toFixed(2)}
                </span>
              </div>
            )}
            {pricingSummary.takeawayDiscountTotal > 0 && (
              <div className="flex justify-between items-center mb-4 text-emerald-700">
                <span className="text-lg font-medium">Takeaway discount</span>
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
            <button
              id="checkoutButtonDesktop"
              className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
              onClick={handleCheckout}
              disabled={loading || cart.length === 0}
            >
              {loading ? "Loading..." : "Proceed to Checkout"}
            </button>
          </div>
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
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded mr-4"
                            />
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
                    {!deliveryMinimumReached && orderType === "livraison" && (
                      <p className="mt-3 text-sm text-red-600">
                        La livraison demande un minimum de {DELIVERY_MINIMUM_ORDER_AMOUNT} EUR.
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

                  <motion.button
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || loading}
                    className={`w-full py-3 rounded-lg font-medium transition duration-300 flex items-center justify-center gap-2 ${
                      cart.length === 0 || loading
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

      <DeliveryMinimumDialog
        open={showDeliveryMinimumDialog}
        onClose={() => setShowDeliveryMinimumDialog(false)}
        total={totalAmount}
        currencySymbol="EUR"
      />
    </div>
  );
}
