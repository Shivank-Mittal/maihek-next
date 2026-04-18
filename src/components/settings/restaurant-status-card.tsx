"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_WINDOWS, type RestaurantStatusSettings } from "@/hooks/use-restaurant-settings";

interface Props {
  settings: RestaurantStatusSettings;
  loading: boolean;
  onSave: (patch: Partial<RestaurantStatusSettings>) => void;
  onWindowChange: (index: number, field: "open" | "close", value: string) => void;
}

export function RestaurantStatusCard({ settings, loading, onSave, onWindowChange }: Props) {
  return (
    <Card className="bg-white border border-gray-300 shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-gray-900">Statut du Restaurant</CardTitle>
        <CardDescription className="text-gray-500 text-sm mt-1">
          Actuellement :{" "}
          <span className={`font-medium ${settings.isOpen ? "text-emerald-600" : "text-red-600"}`}>
            {settings.isOpen ? "Ouvert" : "Ferme"}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div
          className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
            settings.useSchedule
              ? "border-gray-100 bg-gray-50 opacity-50"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <div>
            <p className="font-medium text-gray-900">Ouvert maintenant</p>
            <p className="text-sm text-gray-500">
              {settings.useSchedule
                ? "Désactivé — le mode horaire est actif."
                : "Ouvrir ou fermer manuellement."}
            </p>
          </div>
          <Switch
            checked={settings.manualIsOpen}
            onCheckedChange={(checked) => onSave({ manualIsOpen: checked })}
            disabled={loading || settings.useSchedule}
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <p className="font-medium text-gray-900">Mode horaire</p>
            <p className="text-sm text-gray-500">
              Ouvre et ferme automatiquement selon les horaires ci-dessous.
            </p>
          </div>
          <Switch
            checked={settings.useSchedule}
            onCheckedChange={(checked) => onSave({ useSchedule: checked })}
            disabled={loading}
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Horaires d'ouverture</p>

          {(settings.windows ?? DEFAULT_WINDOWS).map((w, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-sm text-gray-500 w-16">Service {i + 1}</span>
              <Input
                type="time"
                value={w.open}
                onChange={(e) => onWindowChange(i, "open", e.target.value)}
                disabled={loading}
                className="w-36"
              />
              <span className="text-sm text-gray-400">—</span>
              <Input
                type="time"
                value={w.close}
                onChange={(e) => onWindowChange(i, "close", e.target.value)}
                disabled={loading}
                className="w-36"
              />
            </div>
          ))}

          <div className="flex justify-end">
            <Button onClick={() => onSave({ windows: settings.windows })} disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer les horaires"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
