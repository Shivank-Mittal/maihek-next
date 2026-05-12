export type TakeawayDiscountSettings = {
  enabled: boolean;
  percentage: number;
  excludedDishIds: string[];
  excludedCategoryNames: string[];
};

export type DiscountSettingsResponse = {
  takeawayDiscount: TakeawayDiscountSettings;
  updatedAt?: string;
};
