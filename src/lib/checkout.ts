import type { TakeawayDiscountSettings } from "@repo-types/discounts";
import type { DishDiscount } from "@repo-types/dishes";

export const DELIVERY_MINIMUM_ORDER_AMOUNT = 20;

// Pincodes eligible for delivery — add or remove as needed
export const ALLOWED_DELIVERY_PINCODES = ["75001", "75002", "75003"];

export const isPincodeAllowed = (pincode: string) =>
  ALLOWED_DELIVERY_PINCODES.includes(pincode.trim());

type PricedCartItem = {
  price: number;
  quantity?: number;
};

export type DiscountablePricedItem = PricedCartItem & {
  id?: string;
  basePrice?: number;
  category?: string;
  dishDiscount?: DishDiscount | null;
};

export type CartLinePricing = {
  quantity: number;
  unitBasePrice: number;
  unitDishDiscount: number;
  unitTakeawayDiscount: number;
  unitTotal: number;
  lineSubtotal: number;
  lineDishDiscount: number;
  lineTakeawayDiscount: number;
  lineDiscount: number;
  lineTotal: number;
  appliedDiscountLabels: string[];
};

export type CartPricingSummary = {
  subtotal: number;
  dishDiscountTotal: number;
  takeawayDiscountTotal: number;
  totalDiscount: number;
  deliveryCharge: number;
  total: number;
};

export const DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS: TakeawayDiscountSettings = {
  enabled: true,
  percentage: 10,
  excludedDishIds: [],
  excludedCategoryNames: [
    "Menu",
    "Menus",
    "Drink",
    "Drinks",
    "Boisson",
    "Boissons",
    "Beverage",
    "Beverages",
  ],
};

const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const clampPercentage = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, roundCurrency(value)));
};

const normalizeString = (value?: string | null) => value?.trim().toLowerCase() ?? "";

const normalizeComparableString = (value?: string | null) =>
  normalizeString(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const getCategoryMatchKey = (value?: string | null) => {
  const normalizedValue = normalizeComparableString(value);

  if (normalizedValue.includes("menu")) {
    return "menu";
  }

  if (
    normalizedValue.includes("drink") ||
    normalizedValue.includes("boisson") ||
    normalizedValue.includes("beverage")
  ) {
    return "drink";
  }

  return normalizedValue;
};

const normalizeStringArray = (values: string[] | undefined, fallback: string[] = []) => {
  const source = Array.isArray(values) ? values : fallback;

  return Array.from(
    new Set(source.map((value) => value.trim()).filter((value) => value.length > 0))
  );
};

export const sanitizeDishDiscount = (
  discount?: Partial<DishDiscount> | null
): DishDiscount | null => {
  const percentage = clampPercentage(Number(discount?.percentage ?? 0));

  if (percentage <= 0) {
    return null;
  }

  return { percentage };
};

export const sanitizeTakeawayDiscountSettings = (
  settings?: Partial<TakeawayDiscountSettings> | null
): TakeawayDiscountSettings => ({
  enabled: settings?.enabled ?? DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS.enabled,
  percentage: clampPercentage(
    Number(settings?.percentage ?? DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS.percentage)
  ),
  excludedDishIds: normalizeStringArray(
    settings?.excludedDishIds,
    DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS.excludedDishIds
  ),
  excludedCategoryNames: normalizeStringArray(
    settings?.excludedCategoryNames,
    DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS.excludedCategoryNames
  ),
});

export const normalizeOrderType = (value?: string | null) => value?.trim().toLowerCase() ?? "";

export const isDeliveryOrderType = (value?: string | null) =>
  normalizeOrderType(value) === "livraison";

export const isTakeawayOrderType = (value?: string | null) =>
  normalizeOrderType(value) === "emporter";

export const calculateCartTotal = (items: PricedCartItem[]) =>
  items.reduce((total, item) => total + item.price * (item.quantity ?? 1), 0);

const isTakeawayDiscountExcluded = (
  item: Pick<DiscountablePricedItem, "id" | "category">,
  settings: TakeawayDiscountSettings
) => {
  const normalizedId = item.id?.trim();
  const normalizedCategory = getCategoryMatchKey(item.category);

  if (normalizedId && settings.excludedDishIds.includes(normalizedId)) {
    return true;
  }

  return settings.excludedCategoryNames.some(
    (categoryName) => getCategoryMatchKey(categoryName) === normalizedCategory
  );
};

export const calculateCartItemPricing = (
  item: DiscountablePricedItem,
  options?: {
    orderType?: string | null;
    takeawayDiscount?: Partial<TakeawayDiscountSettings> | null;
  }
): CartLinePricing => {
  const quantity = Math.max(1, Math.floor(item.quantity ?? 1));
  const unitBasePrice = roundCurrency(item.basePrice ?? item.price);
  const dishDiscount = sanitizeDishDiscount(item.dishDiscount);
  const takeawayDiscount = sanitizeTakeawayDiscountSettings(options?.takeawayDiscount);

  const unitDishDiscount = dishDiscount
    ? roundCurrency(unitBasePrice * (dishDiscount.percentage / 100))
    : 0;
  const afterDishDiscount = Math.max(0, roundCurrency(unitBasePrice - unitDishDiscount));

  const takeawayApplies =
    isTakeawayOrderType(options?.orderType) &&
    takeawayDiscount.enabled &&
    takeawayDiscount.percentage > 0 &&
    !isTakeawayDiscountExcluded(item, takeawayDiscount);

  const unitTakeawayDiscount = takeawayApplies
    ? roundCurrency(afterDishDiscount * (takeawayDiscount.percentage / 100))
    : 0;
  const unitTotal = Math.max(0, roundCurrency(afterDishDiscount - unitTakeawayDiscount));

  const appliedDiscountLabels: string[] = [];

  if (unitDishDiscount > 0 && dishDiscount) {
    appliedDiscountLabels.push(`Item -${dishDiscount.percentage}%`);
  }

  if (unitTakeawayDiscount > 0) {
    appliedDiscountLabels.push(`Takeaway -${takeawayDiscount.percentage}%`);
  }

  const lineDishDiscount = roundCurrency(unitDishDiscount * quantity);
  const lineTakeawayDiscount = roundCurrency(unitTakeawayDiscount * quantity);

  return {
    quantity,
    unitBasePrice,
    unitDishDiscount,
    unitTakeawayDiscount,
    unitTotal,
    lineSubtotal: roundCurrency(unitBasePrice * quantity),
    lineDishDiscount,
    lineTakeawayDiscount,
    lineDiscount: roundCurrency(lineDishDiscount + lineTakeawayDiscount),
    lineTotal: roundCurrency(unitTotal * quantity),
    appliedDiscountLabels,
  };
};

export const calculateCartPricing = (
  items: DiscountablePricedItem[],
  options?: {
    orderType?: string | null;
    takeawayDiscount?: Partial<TakeawayDiscountSettings> | null;
  }
): CartPricingSummary => {
  const itemsSummary = items.reduce<Omit<CartPricingSummary, "deliveryCharge" | "total">>(
    (summary, item) => {
      const pricing = calculateCartItemPricing(item, options);

      return {
        subtotal: roundCurrency(summary.subtotal + pricing.lineSubtotal),
        dishDiscountTotal: roundCurrency(summary.dishDiscountTotal + pricing.lineDishDiscount),
        takeawayDiscountTotal: roundCurrency(
          summary.takeawayDiscountTotal + pricing.lineTakeawayDiscount
        ),
        totalDiscount: roundCurrency(summary.totalDiscount + pricing.lineDiscount),
      };
    },
    { subtotal: 0, dishDiscountTotal: 0, takeawayDiscountTotal: 0, totalDiscount: 0 }
  );

  const itemsTotal = roundCurrency(itemsSummary.subtotal - itemsSummary.totalDiscount);
  const deliveryCharge = isDeliveryOrderType(options?.orderType)
    ? roundCurrency(Math.max(0, DELIVERY_MINIMUM_ORDER_AMOUNT - itemsTotal))
    : 0;

  return {
    ...itemsSummary,
    deliveryCharge,
    total: roundCurrency(itemsTotal + deliveryCharge),
  };
};

export const getTakeawayDiscountSummary = (settings?: Partial<TakeawayDiscountSettings> | null) => {
  const takeawayDiscount = sanitizeTakeawayDiscountSettings(settings);

  if (!takeawayDiscount.enabled || takeawayDiscount.percentage <= 0) {
    return null;
  }

  const exclusions = takeawayDiscount.excludedCategoryNames.join(", ");

  return exclusions
    ? `-${takeawayDiscount.percentage}% a emporter, hors ${exclusions}`
    : `-${takeawayDiscount.percentage}% a emporter`;
};

export const isDeliveryMinimumMet = (orderType: string | null | undefined, total: number) =>
  !isDeliveryOrderType(orderType) || total >= DELIVERY_MINIMUM_ORDER_AMOUNT;

export const getDeliveryShortfall = (total: number) =>
  Math.max(0, DELIVERY_MINIMUM_ORDER_AMOUNT - total);

export const getDeliveryMinimumMessage = (currencySymbol = "EUR") =>
  `Delivery is available only for orders of ${DELIVERY_MINIMUM_ORDER_AMOUNT} ${currencySymbol} or more.`;
