"use client";

import { Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  FileText,
  Hash,
  Mail,
  MapPin,
  Navigation,
  Phone,
  ShoppingCart,
  Trash2,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

import { DeliveryMinimumDialog } from "@/components/delivery-minimum-dialog";
import { useCart, type CartItem } from "@/hooks/use-cart";
import {
  DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS,
  DELIVERY_MINIMUM_ORDER_AMOUNT,
  calculateCartItemPricing,
  calculateCartPricing,
  getTakeawayDiscountSummary,
  isDeliveryMinimumMet,
} from "@/lib/checkout";
import { fetchAllowedPincodes } from "@/services/delivery-zones-service";
import { getDiscountSettings } from "@/services/discount-settings-service";
import type { DiscountSettingsResponse } from "@repo-types/discounts";

interface FormData {
  name: string;
  phone: string;
  email: string;
  orderType: "emporter" | "livraison";
  paymentMethod: "online" | "cod";
  addressLine?: string;
  floor?: string;
  city?: string;
  pincode?: string;
  instructions?: string;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, removeFromCart, clearCart } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeliveryMinimumDialog, setShowDeliveryMinimumDialog] = useState(false);
  const [allowedPincodes, setAllowedPincodes] = useState<string[]>([]);
  const [discountSettings, setDiscountSettings] = useState<DiscountSettingsResponse>({
    takeawayDiscount: DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      orderType: "livraison",
      paymentMethod: "online",
      addressLine: "",
      floor: "",
      city: "",
      pincode: "",
      instructions: "",
    },
  });

  useEffect(() => {
    const searchOrderType = searchParams.get("orderType");
    if (searchOrderType === "emporter" || searchOrderType === "livraison") {
      setValue("orderType", searchOrderType, { shouldValidate: true });
    }
  }, [searchParams, setValue]);

  useEffect(() => {
    fetchAllowedPincodes().then(setAllowedPincodes);
  }, []);

  useEffect(() => {
    getDiscountSettings()
      .then(setDiscountSettings)
      .catch(() => {
        setDiscountSettings({ takeawayDiscount: DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS });
      });
  }, []);

  const orderType = watch("orderType");
  const paymentMethod = watch("paymentMethod");
  const pricingSummary = calculateCartPricing(cart, {
    orderType,
    takeawayDiscount: discountSettings.takeawayDiscount,
  });
  const totalAmount = pricingSummary.total;
  const totalPrice = pricingSummary.total.toFixed(2);
  const deliveryMinimumReached = isDeliveryMinimumMet(orderType, totalAmount);
  const takeawayNotice = getTakeawayDiscountSummary(discountSettings.takeawayDiscount);

  const handleOrderTypeChange = (value: FormData["orderType"]) => {
    setValue("orderType", value, { shouldValidate: true, shouldDirty: true });
    if (value === "livraison" && !isDeliveryMinimumMet(value, totalAmount)) {
      setShowDeliveryMinimumDialog(true);
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!isDeliveryMinimumMet(data.orderType, totalAmount)) {
      setShowDeliveryMinimumDialog(true);
      return;
    }

    setIsSubmitting(true);
    try {
      if (data.orderType === "livraison" && data.paymentMethod === "online") {
        const response = await fetch("/api/v1/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cart.map((item: CartItem) => {
              const pricing = calculateCartItemPricing(item, {
                orderType: data.orderType,
                takeawayDiscount: discountSettings.takeawayDiscount,
              });

              return {
                name: item.name,
                price: pricing.unitTotal,
                quantity: item.quantity || 1,
              };
            }),
            orderType: data.orderType,
            customerInfo: {
              name: data.name,
              phone: data.phone,
              email: data.email,
            },
            address: {
              addressLine: data.addressLine,
              floor: data.floor,
              city: data.city,
              pincode: data.pincode,
              instructions: data.instructions,
            },
          }),
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.error || "Erreur, réessayez.");
        window.location.href = json.url;
      } else {
        const fullAddress = [data.addressLine, data.floor, data.city].filter(Boolean).join(", ");
        const response = await fetch("/api/v1/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            phone: data.phone,
            email: data.email,
            address: fullAddress,
            zipcode: data.pincode,
            instructions: data.instructions,
            orderType: data.orderType,
            orders: cart.map((item: CartItem) => {
              const pricing = calculateCartItemPricing(item, {
                orderType: data.orderType,
                takeawayDiscount: discountSettings.takeawayDiscount,
              });

              return {
                ...item,
                price: pricing.unitTotal,
              };
            }),
          }),
        });

        if (!response.ok) throw new Error((await response.json()).message);

        clearCart();
        toast.success("Commande réussie !", {
          duration: 3000,
          style: { background: "#1a1a1a", color: "#fff", border: "1px solid #333" },
        });
        setShowModal(true);
        reset();
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur, réessayez.", {
        duration: 3000,
        style: { background: "#fff", color: "#000", border: "1px solid #ccc" },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition duration-200 text-sm";

  return (
    <section className="bg-gray-100 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 text-center mb-2">
            Finaliser la commande
          </h1>
          <p className="text-center text-gray-500 text-base">
            Vérifiez votre panier et complétez vos informations.
          </p>
        </motion.div>

        {cart.length ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <motion.div
              className="bg-white p-6 rounded-lg shadow-md"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-gray-700" />
                Votre Commande
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Produit
                      </th>
                      <th className="py-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Qté
                      </th>
                      <th className="py-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Prix
                      </th>
                      <th className="py-2 px-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item: CartItem) => {
                      const pricing = calculateCartItemPricing(item, {
                        orderType,
                        takeawayDiscount: discountSettings.takeawayDiscount,
                      });

                      return (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-3 px-2 text-sm">
                            <div className="font-medium text-gray-900">{item.name}</div>
                            {item.option && (
                              <div className="text-xs text-gray-500 mt-0.5">{item.option}</div>
                            )}
                            {item.selectedItems && (
                              <ul className="text-xs text-gray-500 mt-0.5">
                                {Object.entries(item.selectedItems).map(([key, value]) => (
                                  <li key={key}>
                                    {key}: {String(value)}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {pricing.lineDiscount > 0 && (
                              <div className="mt-1 text-xs text-emerald-700">
                                {pricing.appliedDiscountLabels.join(" + ")} : -
                                {pricing.lineDiscount.toFixed(2)} €
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-2 text-sm text-gray-600">{item.quantity || 1}</td>
                          <td className="py-3 px-2 text-sm font-medium text-gray-900">
                            {pricing.lineDiscount > 0 && (
                              <div className="text-xs text-gray-400 line-through">
                                {pricing.lineSubtotal.toFixed(2)} €
                              </div>
                            )}
                            {pricing.lineTotal.toFixed(2)} €
                          </td>
                          <td className="py-3 px-2">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              aria-label={`Supprimer ${item.name}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td
                        colSpan={2}
                        className="py-3 px-2 text-sm font-semibold text-gray-700 text-right"
                      >
                        Sous-total :
                      </td>
                      <td colSpan={2} className="py-3 px-2 text-base font-bold text-gray-900">
                        {pricingSummary.subtotal.toFixed(2)} €
                      </td>
                    </tr>
                    {pricingSummary.dishDiscountTotal > 0 && (
                      <tr>
                        <td
                          colSpan={2}
                          className="py-3 px-2 text-sm font-semibold text-emerald-700 text-right"
                        >
                          Remises article :
                        </td>
                        <td colSpan={2} className="py-3 px-2 text-base font-bold text-emerald-700">
                          -{pricingSummary.dishDiscountTotal.toFixed(2)} €
                        </td>
                      </tr>
                    )}
                    {pricingSummary.takeawayDiscountTotal > 0 && (
                      <tr>
                        <td
                          colSpan={2}
                          className="py-3 px-2 text-sm font-semibold text-emerald-700 text-right"
                        >
                          Remise a emporter :
                        </td>
                        <td colSpan={2} className="py-3 px-2 text-base font-bold text-emerald-700">
                          -{pricingSummary.takeawayDiscountTotal.toFixed(2)} €
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td
                        colSpan={2}
                        className="py-3 px-2 text-sm font-semibold text-gray-700 text-right"
                      >
                        Total :
                      </td>
                      <td colSpan={2} className="py-3 px-2 text-base font-bold text-gray-900">
                        {totalPrice} €
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <button
                onClick={() => {
                  clearCart();
                  toast.success("Panier vidé !", {
                    duration: 3000,
                    style: { background: "#1a1a1a", color: "#fff", border: "1px solid #333" },
                  });
                  router.push("/");
                }}
                className="w-full mt-5 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 hover:text-red-500 transition duration-200"
              >
                <Trash2 className="h-4 w-4" />
                Vider le panier
              </button>
            </motion.div>

            <motion.div
              className="bg-white p-6 rounded-lg shadow-md"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center gap-2">
                <User className="h-5 w-5 text-gray-700" />
                Informations
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de commande
                  </label>
                  <div className="flex gap-3">
                    {(["emporter", "livraison"] as const).map((type) => (
                      <label
                        key={type}
                        className={`flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all text-sm ${
                          orderType === type
                            ? "border-black bg-black text-white"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        <input
                          type="radio"
                          value={type}
                          {...register("orderType", { required: true })}
                          checked={orderType === type}
                          onChange={() => handleOrderTypeChange(type)}
                          className="sr-only"
                        />
                        <span className="font-medium">
                          {type === "emporter" ? "À emporter" : "Livraison"}
                        </span>
                      </label>
                    ))}
                  </div>
                  {orderType === "livraison" && !deliveryMinimumReached && (
                    <p className="mt-1.5 text-xs text-red-500">
                      Minimum de {DELIVERY_MINIMUM_ORDER_AMOUNT} € requis pour la livraison.
                    </p>
                  )}
                  {orderType === "emporter" && takeawayNotice && (
                    <p className="mt-1.5 text-xs text-emerald-700">{takeawayNotice}</p>
                  )}
                </div>

                <hr className="border-gray-100" />

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nom Complet <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      id="name"
                      className={inputClass}
                      placeholder="Entrez votre nom"
                      {...register("name", {
                        required: "Le nom est requis",
                        minLength: { value: 2, message: "2 caractères minimum" },
                      })}
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Téléphone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      id="phone"
                      className={inputClass}
                      placeholder="0612345678"
                      {...register("phone", {
                        required: "Numéro requis",
                        pattern: { value: /^[0-9]{10}$/, message: "10 chiffres requis" },
                      })}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    E-mail <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      className={inputClass}
                      placeholder="exemple@domaine.com"
                      {...register("email", {
                        required: "E-mail requis",
                        pattern: { value: /\S+@\S+\.\S+/, message: "E-mail invalide" },
                      })}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                {orderType === "livraison" && (
                  <>
                    <hr className="border-gray-100" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        Adresse de livraison <span className="text-red-500">*</span>
                      </p>

                      <div className="space-y-3">
                        <div>
                          <label htmlFor="addressLine" className="block text-xs text-gray-500 mb-1">
                            Rue et numéro *
                          </label>
                          <div className="relative">
                            <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              id="addressLine"
                              className={inputClass}
                              placeholder="12 Rue de la Paix"
                              {...register("addressLine", {
                                required: "L'adresse est requise",
                                minLength: { value: 5, message: "Adresse trop courte" },
                              })}
                            />
                          </div>
                          {errors.addressLine && (
                            <p className="mt-1 text-xs text-red-500">
                              {errors.addressLine.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="floor" className="block text-xs text-gray-500 mb-1">
                            Étage / Appartement (optionnel)
                          </label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              id="floor"
                              className={inputClass}
                              placeholder="Bât. B, 3ème étage, Apt. 12"
                              {...register("floor")}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="city" className="block text-xs text-gray-500 mb-1">
                              Ville *
                            </label>
                            <input
                              type="text"
                              id="city"
                              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition duration-200 text-sm"
                              placeholder="Paris"
                              {...register("city", { required: "Ville requise" })}
                            />
                            {errors.city && (
                              <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>
                            )}
                          </div>
                          <div>
                            <label htmlFor="pincode" className="block text-xs text-gray-500 mb-1">
                              Code postal *
                            </label>
                            <div className="relative">
                              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                              <select
                                id="pincode"
                                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition duration-200 text-sm appearance-none"
                                {...register("pincode", {
                                  required: "Sélectionnez un code postal",
                                })}
                              >
                                <option value="">-- Sélectionner --</option>
                                {allowedPincodes.map((code) => (
                                  <option key={code} value={code}>
                                    {code}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {errors.pincode && (
                              <p className="mt-1 text-xs text-red-500">{errors.pincode.message}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="instructions"
                            className="block text-xs text-gray-500 mb-1"
                          >
                            Instructions de livraison (optionnel)
                          </label>
                          <div className="relative">
                            <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <textarea
                              id="instructions"
                              rows={2}
                              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition duration-200 text-sm resize-none"
                              placeholder="Code d'entrée, instructions particulières…"
                              {...register("instructions")}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {orderType === "livraison" && (
                  <>
                    <hr className="border-gray-100" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mode de paiement
                      </label>
                      <div className="flex gap-3">
                        {(["online", "cod"] as const).map((method) => (
                          <label
                            key={method}
                            className={`flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all text-sm ${
                              paymentMethod === method
                                ? "border-black bg-black text-white"
                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                            }`}
                          >
                            <input
                              type="radio"
                              value={method}
                              {...register("paymentMethod")}
                              className="sr-only"
                            />
                            {method === "online" ? (
                              <CreditCard className="h-4 w-4 shrink-0" />
                            ) : (
                              <Banknote className="h-4 w-4 shrink-0" />
                            )}
                            <div>
                              <p className="font-medium leading-tight">
                                {method === "online" ? "En ligne" : "À la livraison"}
                              </p>
                              <p
                                className={`text-xs leading-tight mt-0.5 ${
                                  paymentMethod === method ? "text-gray-300" : "text-gray-400"
                                }`}
                              >
                                {method === "online" ? "Carte via Stripe" : "Espèces"}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <motion.button
                  type="submit"
                  disabled={isSubmitting || (orderType === "livraison" && !deliveryMinimumReached)}
                  className="w-full bg-black text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed mt-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
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
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Traitement...
                    </>
                  ) : orderType === "livraison" && paymentMethod === "online" ? (
                    "Payer en ligne →"
                  ) : (
                    "Confirmer la commande →"
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
        ) : (
          <motion.div
            className="flex flex-col items-center justify-center h-[50vh] gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <ShoppingCart className="h-14 w-14 text-gray-300" />
            <h3 className="text-2xl font-semibold text-gray-700">Votre panier est vide !</h3>
            <Link
              href="/"
              className="bg-black text-white py-2.5 px-6 rounded-lg hover:bg-gray-800 transition duration-300"
            >
              Retour à l'accueil
            </Link>
          </motion.div>
        )}

        <AnimatePresence>
          {showModal && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col items-center text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Commande Confirmée</h3>
                  <p className="text-gray-600 mb-1">Merci pour votre commande !</p>
                  <p className="text-gray-400 text-sm mb-6">
                    Un e-mail de confirmation vous a été envoyé.
                  </p>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      router.push("/");
                    }}
                    className="w-full bg-black text-white py-2.5 rounded-lg hover:bg-gray-800 transition duration-300 font-medium"
                  >
                    Fermer
                  </button>
                </div>
              </motion.div>
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
    </section>
  );
}

export default function Checkout() {
  return (
    <Suspense fallback={<section className="min-h-screen bg-gray-100" />}>
      <CheckoutContent />
    </Suspense>
  );
}
