"use client";

import { AnimatePresence, motion } from "framer-motion";
import { DELIVERY_MINIMUM_ORDER_AMOUNT, getDeliveryShortfall } from "@/lib/checkout";

type DeliveryMinimumDialogProps = {
  open: boolean;
  onClose: () => void;
  total: number;
  currencySymbol?: string;
};

export function DeliveryMinimumDialog({
  open,
  onClose,
  total,
  currencySymbol = "EUR",
}: DeliveryMinimumDialogProps) {
  const shortfall = getDeliveryShortfall(total);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-xl font-semibold text-gray-900">
              Montant minimum de livraison non atteint
            </h3>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              La livraison est disponible uniquement pour les commandes de{" "}
              {DELIVERY_MINIMUM_ORDER_AMOUNT} {currencySymbol} ou plus.
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Votre total actuel est de {total.toFixed(2)} {currencySymbol}. Ajoutez{" "}
              {shortfall.toFixed(2)} {currencySymbol} de plus, ou passez la commande en retrait.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-lg bg-black py-3 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              D'accord
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
