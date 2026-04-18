"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { ReservationControlCard } from "@/components/settings/reservation-control-card";
import { RestaurantStatusCard } from "@/components/settings/restaurant-status-card";
import { TakeawayDiscountCard } from "@/components/settings/takeaway-discount-card";
import { useReservationControl, type ReservationStatus } from "@/hooks/use-reservation-control";
import {
  useRestaurantSettings,
  type RestaurantStatusSettings,
} from "@/hooks/use-restaurant-settings";
import { useTakeawayDiscount } from "@/hooks/use-takeaway-discount";
import { getDiscountSettings } from "@/services/discount-settings-service";
import { listAdminDishes, listCategoryOptions } from "@/services/dishes-service";
import type { AdminDish, DishCategoryOption } from "@repo-types/dishes";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const accessToken = session?.accessToken;

  const restaurantSettings = useRestaurantSettings(accessToken);
  const reservationControl = useReservationControl(accessToken);
  const takeawayDiscount = useTakeawayDiscount(accessToken);

  const [categories, setCategories] = useState<DishCategoryOption[]>([]);
  const [dishes, setDishes] = useState<AdminDish[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      signIn();
    } else if (session.user?.role !== "admin") {
      router.push("/");
    }
  }, [router, session, status]);

  useEffect(() => {
    if (!session) return;

    const fetchPageData = async () => {
      setPageLoading(true);
      try {
        const [
          reservationResponse,
          restaurantResponse,
          discountResponse,
          categoryOptions,
          adminDishes,
        ] = await Promise.all([
          fetch("/api/v1/reservation-status"),
          fetch("/api/v1/restaurant-status"),
          getDiscountSettings(),
          listCategoryOptions(),
          listAdminDishes(),
        ]);

        if (reservationResponse.ok) {
          const data: ReservationStatus = await reservationResponse.json();
          reservationControl.setReservationStatus(data);
        }

        if (restaurantResponse.ok) {
          const data: RestaurantStatusSettings = await restaurantResponse.json();
          const windows = data.windows?.length ? data.windows : restaurantSettings.settings.windows;
          restaurantSettings.setSettings({ ...data, windows });
        }

        takeawayDiscount.setTakeawayDiscount(discountResponse.takeawayDiscount);
        setCategories(categoryOptions);
        setDishes(adminDishes);
      } catch (error) {
        console.error(error);
        toast.error("Impossible de charger les reglages.");
      } finally {
        setPageLoading(false);
      }
    };

    fetchPageData();
  }, [session]);

  if (status === "loading" || pageLoading || !session || session.user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-700 text-lg">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10 flex justify-center">
      <motion.div
        className="w-full max-w-5xl space-y-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <RestaurantStatusCard
          settings={restaurantSettings.settings}
          loading={restaurantSettings.loading}
          onSave={restaurantSettings.save}
          onWindowChange={(index, field, value) =>
            restaurantSettings.setSettings((prev) => ({
              ...prev,
              windows: prev.windows.map((w, i) => (i === index ? { ...w, [field]: value } : w)),
            }))
          }
        />

        <ReservationControlCard
          reservationStatus={reservationControl.reservationStatus}
          pendingStatus={reservationControl.pendingStatus}
          dialogOpen={reservationControl.dialogOpen}
          loading={reservationControl.loading}
          onToggle={reservationControl.requestToggle}
          onConfirm={reservationControl.confirmToggle}
          onCancel={reservationControl.cancelToggle}
        />

        <TakeawayDiscountCard
          takeawayDiscount={takeawayDiscount.takeawayDiscount}
          categories={categories}
          dishes={dishes}
          loading={takeawayDiscount.loading}
          onChange={takeawayDiscount.setTakeawayDiscount}
          onSave={takeawayDiscount.save}
        />
      </motion.div>
    </div>
  );
}
