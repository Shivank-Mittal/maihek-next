"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS, getTakeawayDiscountSummary } from "@/lib/checkout";
import { getDiscountSettings, updateDiscountSettings } from "@/services/discount-settings-service";
import { useRestaurantStatus } from "@/hooks/use-restaurant-status";
import { listAdminDishes, listCategoryOptions } from "@/services/dishes-service";
import type { TakeawayDiscountSettings } from "@repo-types/discounts";
import type { AdminDish, DishCategoryOption } from "@repo-types/dishes";

interface ReservationStatus {
  status: "paused" | "resumed";
}

interface RestaurantStatusSettings {
  isOpen: boolean;
  useSchedule: boolean;
  manualIsOpen: boolean;
  windows: { open: string; close: string }[];
}

const toggleValue = (values: string[], value: string, checked: boolean) => {
  if (checked) {
    return Array.from(new Set([...values, value]));
  }

  return values.filter((item) => item !== value);
};

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { refresh: refreshRestaurantStatus } = useRestaurantStatus();
  const DEFAULT_WINDOWS = [
    { open: "11:45", close: "14:15" },
    { open: "18:30", close: "22:30" },
  ];
  const [restaurantSettings, setRestaurantSettings] = useState<RestaurantStatusSettings>({
    isOpen: true,
    useSchedule: false,
    manualIsOpen: true,
    windows: DEFAULT_WINDOWS,
  });
  const windowsRef = useRef(DEFAULT_WINDOWS as RestaurantStatusSettings["windows"]);
  const [restaurantLoading, setRestaurantLoading] = useState(false);

  const [reservationStatus, setReservationStatus] = useState<ReservationStatus>({
    status: "resumed",
  });
  const [pendingStatus, setPendingStatus] = useState<"paused" | "resumed" | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [categories, setCategories] = useState<DishCategoryOption[]>([]);
  const [dishes, setDishes] = useState<AdminDish[]>([]);
  const [takeawayDiscount, setTakeawayDiscount] = useState<TakeawayDiscountSettings>(
    DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS
  );

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
        const [reservationResponse, restaurantResponse, discountResponse, categoryOptions, adminDishes] =
          await Promise.all([
            fetch("/api/v1/reservation-status"),
            fetch("/api/v1/restaurant-status"),
            getDiscountSettings(),
            listCategoryOptions(),
            listAdminDishes(),
          ]);

        if (reservationResponse.ok) {
          const data: ReservationStatus = await reservationResponse.json();
          setReservationStatus(data);
        }

        if (restaurantResponse.ok) {
          const data: RestaurantStatusSettings = await restaurantResponse.json();
          const windows = data.windows?.length ? data.windows : DEFAULT_WINDOWS;
          windowsRef.current = windows;
          setRestaurantSettings({ ...data, windows });
        }

        setTakeawayDiscount(discountResponse.takeawayDiscount);
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

  const confirmToggle = async () => {
    if (!pendingStatus || !session?.accessToken) return;

    setReservationLoading(true);

    try {
      const response = await fetch("/api/v1/reservation-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ status: pendingStatus }),
      });

      if (!response.ok) {
        throw new Error("Impossible de mettre a jour les reservations.");
      }

      const data: ReservationStatus = await response.json();
      setReservationStatus(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur de mise a jour.");
    } finally {
      setReservationLoading(false);
      setDialogOpen(false);
      setPendingStatus(null);
    }
  };

  const saveRestaurantStatus = async (patch: Partial<RestaurantStatusSettings>) => {
    if (!session?.accessToken) return;
    setRestaurantLoading(true);
    try {
      const response = await fetch("/api/v1/restaurant-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(patch),
      });
      if (!response.ok) throw new Error("Impossible de mettre a jour le statut.");
      const data: RestaurantStatusSettings = await response.json();
      setRestaurantSettings({ ...data, windows: patch.windows || [] });
      await refreshRestaurantStatus();
      toast.success("Statut du restaurant mis a jour.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur.");
    } finally {
      setRestaurantLoading(false);
    }
  };

  const saveTakeawayDiscount = async () => {
    if (!session?.accessToken) {
      toast.error("Session admin introuvable.");
      return;
    }

    setDiscountLoading(true);

    try {
      const response = await updateDiscountSettings(takeawayDiscount, session.accessToken);
      setTakeawayDiscount(response.takeawayDiscount);
      toast.success("Remise a emporter mise a jour.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'enregistrer la remise.");
    } finally {
      setDiscountLoading(false);
    }
  };

  if (status === "loading" || pageLoading || !session || session.user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-700 text-lg">Chargement...</p>
      </div>
    );
  }

  const takeawaySummary = getTakeawayDiscountSummary(takeawayDiscount) ?? "Aucune remise active";

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10 flex justify-center">
      <motion.div
        className="w-full max-w-5xl space-y-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="bg-white border border-gray-300 shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Statut du Restaurant
            </CardTitle>
            <CardDescription className="text-gray-500 text-sm mt-1">
              Actuellement :{" "}
              <span className={`font-medium ${restaurantSettings.isOpen ? "text-emerald-600" : "text-red-600"}`}>
                {restaurantSettings.isOpen ? "Ouvert" : "Ferme"}
              </span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Manual override — disabled when schedule mode is on */}
            <div className={`flex items-center justify-between rounded-xl border px-4 py-3 ${restaurantSettings.useSchedule ? "border-gray-100 bg-gray-50 opacity-50" : "border-gray-200 bg-gray-50"}`}>
              <div>
                <p className="font-medium text-gray-900">Ouvert maintenant</p>
                <p className="text-sm text-gray-500">
                  {restaurantSettings.useSchedule
                    ? "Désactivé — le mode horaire est actif."
                    : "Ouvrir ou fermer manuellement."}
                </p>
              </div>
              <Switch
                checked={restaurantSettings.manualIsOpen}
                onCheckedChange={(checked) =>
                  saveRestaurantStatus({ manualIsOpen: checked })
                }
                disabled={restaurantLoading || restaurantSettings.useSchedule}
              />
            </div>

            {/* Schedule toggle */}
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div>
                <p className="font-medium text-gray-900">Mode horaire</p>
                <p className="text-sm text-gray-500">Ouvre et ferme automatiquement selon les horaires ci-dessous.</p>
              </div>
              <Switch
                checked={restaurantSettings.useSchedule}
                onCheckedChange={(checked) =>
                  saveRestaurantStatus({ useSchedule: checked })
                }
                disabled={restaurantLoading}
              />
            </div>

            {/* Time windows */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Horaires d'ouverture</p>

              {(restaurantSettings.windows ?? DEFAULT_WINDOWS).map((w, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-16">Service {i + 1}</span>
                  <Input type="time" value={w.open}
                    onChange={(e) => {
                      const prev = windowsRef.current?.length ? windowsRef.current : DEFAULT_WINDOWS;
                      const windows = prev.map((win, idx) =>
                        idx === i ? { ...win, open: e.target.value } : win
                      );
                      windowsRef.current = windows;
                      setRestaurantSettings((s) => ({ ...s, windows }));
                    }}
                    disabled={restaurantLoading}
                    className="w-36"
                  />
                  <span className="text-sm text-gray-400">—</span>
                  <Input
                    type="time"
                    value={w.close}
                    onChange={(e) => {
                      const prev = windowsRef.current?.length ? windowsRef.current : DEFAULT_WINDOWS;
                      const windows = prev.map((win, idx) =>
                        idx === i ? { ...win, close: e.target.value } : win
                      );
                      windowsRef.current = windows;
                      setRestaurantSettings((s) => ({ ...s, windows }));
                    }}
                    disabled={restaurantLoading}
                    className="w-36"
                  />
                </div>
              ))}
              <div className="flex justify-end">
                <Button
                  onClick={() => saveRestaurantStatus({ windows: windowsRef.current })}
                  disabled={restaurantLoading}
                >
                  {restaurantLoading ? "Enregistrement..." : "Enregistrer les horaires"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-300 shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Controle des Reservations
            </CardTitle>
            <CardDescription className="text-gray-500 text-sm mt-1">
              Actuellement :{" "}
              <span className="text-black font-medium">
                {reservationStatus.status === "paused" ? "Suspendu" : "Actif"}
              </span>
            </CardDescription>
          </CardHeader>

          <CardContent className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-gray-800">
                Reservation {reservationStatus.status === "paused" ? "Desactivee" : "Activee"}
              </span>
              <Switch
                checked={reservationStatus.status === "resumed"}
                onCheckedChange={() => {
                  const newStatus = reservationStatus.status === "paused" ? "resumed" : "paused";
                  setPendingStatus(newStatus);
                  setDialogOpen(true);
                }}
                disabled={reservationLoading}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-300 shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Remise a emporter
            </CardTitle>
            <CardDescription className="text-gray-500 text-sm mt-1">
              {takeawaySummary}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div>
                <p className="font-medium text-gray-900">Activer la remise a emporter</p>
                <p className="text-sm text-gray-500">
                  Elle s'applique a tous les plats eligibles, sauf exclusions configurees ici.
                </p>
              </div>
              <Switch
                checked={takeawayDiscount.enabled}
                onCheckedChange={(checked) =>
                  setTakeawayDiscount((current) => ({
                    ...current,
                    enabled: checked,
                  }))
                }
                disabled={discountLoading}
              />
            </div>

            <div className="grid gap-2 sm:max-w-xs">
              <Label htmlFor="takeaway-percentage">Pourcentage</Label>
              <Input
                id="takeaway-percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={takeawayDiscount.percentage}
                onChange={(event) =>
                  setTakeawayDiscount((current) => ({
                    ...current,
                    percentage: Number.parseFloat(event.target.value) || 0,
                  }))
                }
                disabled={discountLoading}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="mb-3">
                  <p className="font-medium text-gray-900">Exclure des categories</p>
                  <p className="text-sm text-gray-500">
                    Les categories cochees ne recevront pas la remise emporter.
                  </p>
                </div>
                <div className="grid max-h-72 gap-3 overflow-y-auto pr-2">
                  {categories.map((category) => {
                    const checked = takeawayDiscount.excludedCategoryNames.includes(category.name);

                    return (
                      <label
                        key={category.name}
                        className="flex items-center gap-3 text-sm text-gray-700"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) =>
                            setTakeawayDiscount((current) => ({
                              ...current,
                              excludedCategoryNames: toggleValue(
                                current.excludedCategoryNames,
                                category.name,
                                value === true
                              ),
                            }))
                          }
                          disabled={discountLoading}
                        />
                        <span>{category.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <div className="mb-3">
                  <p className="font-medium text-gray-900">Exclure des plats</p>
                  <p className="text-sm text-gray-500">
                    Utilisez cette liste pour retirer quelques plats precis seulement.
                  </p>
                </div>
                <div className="grid max-h-72 gap-3 overflow-y-auto pr-2">
                  {dishes.map((dish) => {
                    const checked = takeawayDiscount.excludedDishIds.includes(dish._id);

                    return (
                      <label
                        key={dish._id}
                        className="flex items-center gap-3 text-sm text-gray-700"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) =>
                            setTakeawayDiscount((current) => ({
                              ...current,
                              excludedDishIds: toggleValue(
                                current.excludedDishIds,
                                dish._id,
                                value === true
                              ),
                            }))
                          }
                          disabled={discountLoading}
                        />
                        <span>
                          {dish.name}
                          <span className="ml-2 text-xs text-gray-500">{dish.category}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={saveTakeawayDiscount} disabled={discountLoading}>
                {discountLoading ? "Enregistrement..." : "Enregistrer la remise"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l'action</DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir{" "}
              <span className="font-semibold">
                {pendingStatus === "paused" ? "suspendre" : "reprendre"}
              </span>{" "}
              les reservations ?
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setPendingStatus(null);
              }}
              disabled={reservationLoading}
            >
              Annuler
            </Button>
            <Button onClick={confirmToggle} disabled={reservationLoading}>
              {reservationLoading ? "Mise a jour..." : "Confirmer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
