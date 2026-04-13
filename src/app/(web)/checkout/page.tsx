"use client";

import { Suspense, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Phone, Mail, MapPin, Landmark, ShoppingCart, Trash2, X } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { DeliveryMinimumDialog } from "@/components/delivery-minimum-dialog";
import { DELIVERY_MINIMUM_ORDER_AMOUNT, isDeliveryMinimumMet } from "@/lib/checkout";

const translations = {
  fr: {
    title: "Finalisez Votre Commande",
    subtitle: "Complétez vos sélections culinaires avec facilité.",
    orderTitle: "Votre Commande",
    product: "Produit",
    quantity: "Quantité",
    price: "Prix (€)",
    details: "Détails",
    total: "Total",
    billingTitle: "Informations de Facturation",
    fullName: "Nom Complet",
    fullNamePlaceholder: "Entrez votre nom",
    fullNameRequired: "Le nom est requis",
    fullNameMinLength: "Le nom doit avoir 2 caractères minimum",
    phone: "Numéro de Téléphone",
    phonePlaceholder: "1234567890",
    phoneRequired: "Numéro requis",
    phoneInvalid: "Entrez un numéro valide à 10 chiffres",
    email: "Adresse E-mail",
    emailPlaceholder: "exemple@domaine.com",
    emailRequired: "E-mail requis",
    emailInvalid: "Entrez un e-mail valide",
    address: "Adresse",
    addressPlaceholder: "123 Rue Principale",
    addressRequired: "Adresse requise",
    addressMinLength: "Adresse doit avoir 5 caractères minimum",
    zipcode: "Code Postal",
    zipcodePlaceholder: "12345",
    zipcodeRequired: "Code postal requis",
    zipcodeInvalid: "Entrez un code postal valide à 5 chiffres",
    placeOrder: "Passer la Commande",
    processing: "Traitement...",
    clearCart: "Vider le Panier",
    cartEmpty: "Votre panier est vide !",
    goToHome: "Retour à l’Accueil",
    modalTitle: "Commande Confirmée",
    modalThankYou: "Merci pour votre commande !",
    modalTotal: "Total",
    modalItems: "Articles",
    modalEmailConfirmation: "E-mail de confirmation envoyé.",
    modalClose: "Fermer",
    toastSuccess: "Commande réussie !",
    toastError: "Erreur, réessayez.",
    toastCartCleared: "Panier vidé !",
    orderTypeTitle: "Type de Commande",
    emporter: "À emporter",
    livraison: "Livraison",
    orderTypeRequired: "Sélectionnez un type de commande",
    removeItem: "Supprimer",
  },
};

interface FormData {
  name: string;
  phone: string;
  email: string;
  address?: string;
  zipcode?: string;
  orderType: "emporter" | "livraison";
}

interface CartItem {
  id: string; // Added id for unique identification
  name: string;
  quantity: number;
  price: number;
  option?: string;
  selectedItems?: Record<string, string>;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, removeFromCart } = useCart(); // Assumes useCart provides removeFromCart
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showDeliveryMinimumDialog, setShowDeliveryMinimumDialog] = useState<boolean>(false);
  const [language] = useState<"fr">("fr");

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
    },
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  useEffect(() => {
    const searchOrderType = searchParams.get("orderType");
    if (searchOrderType === "emporter" || searchOrderType === "livraison") {
      setValue("orderType", searchOrderType, {
        shouldValidate: true,
      });
    }
  }, [searchParams, setValue]);

  const t = translations[language];
  const orderType = watch("orderType");
  const totalAmount = cart.reduce(
    (total: number, order: CartItem) => total + (order.quantity || 1) * order.price,
    0
  );
  const totalPrice = totalAmount.toFixed(2);
  const deliveryMinimumReached = isDeliveryMinimumMet(orderType, totalAmount);

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
      const response = await fetch("/api/v1/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, orders: cart, language }),
      });

      if (!response.ok) throw new Error((await response.json()).message);

      localStorage.removeItem("cartItems");
      toast.success(t.toastSuccess, {
        duration: 3000,
        style: { background: "#1a1a1a", color: "#fff", border: "1px solid #333" },
      });
      setShowModal(true);
      reset();
    } catch (error: any) {
      toast.error(error.message || t.toastError, {
        duration: 3000,
        style: { background: "#fff", color: "#000", border: "1px solid #ccc" },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    router.push("/");
  };

  return (
    <section className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center">
                1
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Panier</span>
            </div>
            <div className="w-12 h-1 bg-black"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Paiement</span>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
            {t.title}
          </h2>
          <p className="text-center text-gray-600 mb-10 text-lg">{t.subtitle}</p>
        </motion.div>

        {cart.length ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <motion.div
              className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-lg border border-gray-100"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingCart className="h-6 w-6" />
                {t.orderTitle}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-4 text-sm font-medium text-gray-700">{t.product}</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-700">{t.quantity}</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-700">{t.price}</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-700">{t.details}</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-700"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((order: CartItem, index: number) => (
                      <tr key={order.id} className="border-b border-gray-100">
                        <td className="py-3 px-4">{order.name}</td>
                        <td className="py-3 px-4">{order.quantity || 1}</td>
                        <td className="py-3 px-4">
                          {((order.quantity || 1) * order.price).toFixed(2)} €
                        </td>
                        <td className="py-3 px-4">
                          {order.option && <span>{order.option}</span>}
                          {order.selectedItems && (
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {Object.entries(order.selectedItems).map(([key, value]) => (
                                <li key={key}>
                                  {key}: {value}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => removeFromCart(order.id)}
                            className="text-red-500 hover:text-red-700"
                            aria-label={`Remove ${order.name} from cart`}
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={4} className="py-3 px-4 font-semibold text-right text-gray-700">
                        {t.total}:
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{totalPrice} €</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <motion.button
                onClick={() => {
                  localStorage.removeItem("cartItems");
                  toast.success(t.toastCartCleared, {
                    duration: 3000,
                    style: { background: "#1a1a1a", color: "#fff", border: "1px solid #333" },
                  });
                  router.push("/");
                }}
                className="w-full mt-6 bg-gray-600 text-white py-2.5 rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Trash2 className="h-5 w-5" />
                {t.clearCart}
              </motion.button>
            </motion.div>

            {/* Checkout Form */}
            <motion.div
              className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-lg border border-gray-100"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-6 w-6" />
                {t.billingTitle}
              </h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="relative">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.fullName}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      id="name"
                      {...register("name", {
                        required: t.fullNameRequired,
                        minLength: { value: 2, message: t.fullNameMinLength },
                      })}
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 transition-all duration-200"
                      placeholder={t.fullNamePlaceholder}
                      aria-invalid={errors.name ? "true" : "false"}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.phone}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      id="phone"
                      {...register("phone", {
                        required: t.phoneRequired,
                        pattern: { value: /^[0-9]{10}$/, message: t.phoneInvalid },
                      })}
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 transition-all duration-200"
                      placeholder={t.phonePlaceholder}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.email}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      {...register("email", {
                        required: t.emailRequired,
                        pattern: { value: /\S+@\S+\.\S+/, message: t.emailInvalid },
                      })}
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 transition-all duration-200"
                      placeholder={t.emailPlaceholder}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {orderType === "livraison" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="relative">
                        <label
                          htmlFor="address"
                          className="block text-sm font-medium text-gray-700 mb-1.5"
                        >
                          {t.address}
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            id="address"
                            {...register("address", {
                              required: t.addressRequired,
                              minLength: { value: 5, message: t.addressMinLength },
                            })}
                            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 transition-all duration-200"
                            placeholder={t.addressPlaceholder}
                          />
                          {errors.address && (
                            <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="relative mt-5">
                        <label
                          htmlFor="zipcode"
                          className="block text-sm font-medium text-gray-700 mb-1.5"
                        >
                          {t.zipcode}
                        </label>
                        <div className="relative">
                          <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            id="zipcode"
                            {...register("zipcode", {
                              required: t.zipcodeRequired,
                              pattern: { value: /^[0-9]{5}$/, message: t.zipcodeInvalid },
                            })}
                            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 transition-all duration-200"
                            placeholder={t.zipcodePlaceholder}
                          />
                          {errors.zipcode && (
                            <p className="mt-1 text-sm text-red-500">{errors.zipcode.message}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.orderTypeTitle}
                  </label>
                  <div className="flex gap-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="emporter"
                        {...register("orderType", { required: t.orderTypeRequired })}
                        checked={orderType === "emporter"}
                        onChange={() => handleOrderTypeChange("emporter")}
                        className="mr-2 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      {t.emporter}
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="livraison"
                        {...register("orderType", { required: t.orderTypeRequired })}
                        checked={orderType === "livraison"}
                        onChange={() => handleOrderTypeChange("livraison")}
                        className="mr-2 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      {t.livraison}
                    </label>
                  </div>
                  {!deliveryMinimumReached && orderType === "livraison" && (
                    <p className="mt-2 text-sm text-red-500">
                      Delivery requires a minimum order of {DELIVERY_MINIMUM_ORDER_AMOUNT} EUR.
                    </p>
                  )}
                  {errors.orderType && (
                    <p className="mt-1 text-sm text-red-500">{errors.orderType.message}</p>
                  )}
                </div>

                <motion.button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    (orderType === "livraison" &&
                      (!watch("address") || !watch("zipcode") || !deliveryMinimumReached))
                  }
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {isSubmitting ? (
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
                      {t.processing}
                    </>
                  ) : (
                    t.placeOrder
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
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-2xl md:text-3xl font-semibold text-gray-900">{t.cartEmpty}</h3>
            <Link
              href="/"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 px-6 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
            >
              {t.goToHome}
            </Link>
          </motion.div>
        )}

        <AnimatePresence>
          {showModal && (
            <motion.div
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white/90 backdrop-blur-md p-8 rounded-xl shadow-lg max-w-md w-full"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{t.modalTitle}</h3>
                <p className="text-gray-700 mb-6">
                  {t.modalThankYou} <br />
                  <strong>{t.modalTotal}:</strong> {totalPrice} € <br />
                  <strong>{t.modalItems}:</strong> <br />
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {cart.map((order: CartItem) => (
                      <li key={order.id}>
                        {order.name} (x{order.quantity || 1}) -{" "}
                        {((order.quantity || 1) * order.price).toFixed(2)} €
                      </li>
                    ))}
                  </ul>
                </p>
                <p className="text-gray-600 mb-6">{t.modalEmailConfirmation}</p>
                <motion.button
                  onClick={closeModal}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {t.modalClose}
                </motion.button>
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
    <Suspense fallback={<section className="min-h-screen bg-gray-50" />}>
      <CheckoutContent />
    </Suspense>
  );
}
