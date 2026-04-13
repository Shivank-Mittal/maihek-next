"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  DELIVERY_MINIMUM_ORDER_AMOUNT,
  getDeliveryShortfall,
} from "@/lib/checkout";

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
            <h3 className="text-xl font-semibold text-gray-900">Delivery minimum not reached</h3>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Delivery is available only for orders of {DELIVERY_MINIMUM_ORDER_AMOUNT}{" "}
              {currencySymbol} or more.
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Your current total is {total.toFixed(2)} {currencySymbol}. Add {shortfall.toFixed(2)}{" "}
              {currencySymbol} more, or switch the order to takeaway.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-lg bg-black py-3 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Okay
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
