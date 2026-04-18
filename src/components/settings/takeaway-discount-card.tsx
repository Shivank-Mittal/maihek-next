"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getTakeawayDiscountSummary } from "@/lib/checkout";
import type { TakeawayDiscountSettings } from "@repo-types/discounts";
import type { AdminDish, DishCategoryOption } from "@repo-types/dishes";

const toggleValue = (values: string[], value: string, checked: boolean) => {
  if (checked) return Array.from(new Set([...values, value]));
  return values.filter((item) => item !== value);
};

interface Props {
  takeawayDiscount: TakeawayDiscountSettings;
  categories: DishCategoryOption[];
  dishes: AdminDish[];
  loading: boolean;
  onChange: (updated: TakeawayDiscountSettings) => void;
  onSave: () => void;
}

export function TakeawayDiscountCard({
  takeawayDiscount,
  categories,
  dishes,
  loading,
  onChange,
  onSave,
}: Props) {
  const summary = getTakeawayDiscountSummary(takeawayDiscount) ?? "Aucune remise active";

  return (
    <Card className="bg-white border border-gray-300 shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-gray-900">Remise a emporter</CardTitle>
        <CardDescription className="text-gray-500 text-sm mt-1">{summary}</CardDescription>
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
            onCheckedChange={(checked) => onChange({ ...takeawayDiscount, enabled: checked })}
            disabled={loading}
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
            onChange={(e) =>
              onChange({ ...takeawayDiscount, percentage: Number.parseFloat(e.target.value) || 0 })
            }
            disabled={loading}
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
              {categories.map((category) => (
                <label
                  key={category.name}
                  className="flex items-center gap-3 text-sm text-gray-700"
                >
                  <Checkbox
                    checked={takeawayDiscount.excludedCategoryNames.includes(category.name)}
                    onCheckedChange={(value) =>
                      onChange({
                        ...takeawayDiscount,
                        excludedCategoryNames: toggleValue(
                          takeawayDiscount.excludedCategoryNames,
                          category.name,
                          value === true
                        ),
                      })
                    }
                    disabled={loading}
                  />
                  <span>{category.name}</span>
                </label>
              ))}
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
              {dishes.map((dish) => (
                <label key={dish._id} className="flex items-center gap-3 text-sm text-gray-700">
                  <Checkbox
                    checked={takeawayDiscount.excludedDishIds.includes(dish._id)}
                    onCheckedChange={(value) =>
                      onChange({
                        ...takeawayDiscount,
                        excludedDishIds: toggleValue(
                          takeawayDiscount.excludedDishIds,
                          dish._id,
                          value === true
                        ),
                      })
                    }
                    disabled={loading}
                  />
                  <span>
                    {dish.name}
                    <span className="ml-2 text-xs text-gray-500">{dish.category}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer la remise"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
