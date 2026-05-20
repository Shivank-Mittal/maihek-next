export type AddonSettings = {
  globalEnabled: boolean;
  excludedCategoryNames: string[];
  excludedDishIds: string[];
  dishExcludedAddonIds: Record<string, string[]>;
};

export const DEFAULT_ADDON_SETTINGS: AddonSettings = {
  globalEnabled: true,
  excludedCategoryNames: [],
  excludedDishIds: [],
  dishExcludedAddonIds: {},
};

const normalizeString = (value?: string | null) =>
  (value?.trim().toLowerCase() ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

export const isDishAddonEligible = (
  dishId: string,
  categoryName: string,
  settings: AddonSettings
): boolean => {
  if (!settings.globalEnabled) return false;
  if (settings.excludedDishIds.includes(dishId)) return false;
  const key = normalizeString(categoryName);
  return !settings.excludedCategoryNames.some((n) => normalizeString(n) === key);
};

export const getEnabledAddonsForDish = (
  dishId: string,
  settings: AddonSettings,
  allAddonIds: string[]
): string[] => {
  const excluded = settings.dishExcludedAddonIds[dishId] ?? [];
  return allAddonIds.filter((id) => !excluded.includes(id));
};
