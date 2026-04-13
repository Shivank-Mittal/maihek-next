export const DELIVERY_MINIMUM_ORDER_AMOUNT = 20;

type PricedCartItem = {
  price: number;
  quantity?: number;
};

export const normalizeOrderType = (value?: string | null) => value?.trim().toLowerCase() ?? "";

export const isDeliveryOrderType = (value?: string | null) =>
  normalizeOrderType(value) === "livraison";

export const calculateCartTotal = (items: PricedCartItem[]) =>
  items.reduce((total, item) => total + item.price * (item.quantity ?? 1), 0);

export const isDeliveryMinimumMet = (orderType: string | null | undefined, total: number) =>
  !isDeliveryOrderType(orderType) || total >= DELIVERY_MINIMUM_ORDER_AMOUNT;

export const getDeliveryShortfall = (total: number) =>
  Math.max(0, DELIVERY_MINIMUM_ORDER_AMOUNT - total);

export const getDeliveryMinimumMessage = (currencySymbol = "EUR") =>
  `Delivery is available only for orders of ${DELIVERY_MINIMUM_ORDER_AMOUNT} ${currencySymbol} or more.`;
