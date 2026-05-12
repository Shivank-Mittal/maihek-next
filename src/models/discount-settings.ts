import mongoose, { Document, Model, Schema } from "mongoose";
import type { TakeawayDiscountSettings } from "@repo-types/discounts";
import {
  DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS,
  sanitizeTakeawayDiscountSettings,
} from "@/lib/checkout";

export interface DiscountSettingsDocument extends Document {
  takeawayDiscount: TakeawayDiscountSettings;
  updatedAt: Date;
}

interface DiscountSettingsModel extends Model<DiscountSettingsDocument> {
  getSettings(): Promise<DiscountSettingsDocument>;
}

const discountSettingsSchema = new Schema<DiscountSettingsDocument>({
  takeawayDiscount: {
    enabled: {
      type: Boolean,
      default: DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS.enabled,
    },
    percentage: {
      type: Number,
      default: DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS.percentage,
    },
    excludedDishIds: {
      type: [String],
      default: DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS.excludedDishIds,
    },
    excludedCategoryNames: {
      type: [String],
      default: DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS.excludedCategoryNames,
    },
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

discountSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({});

  if (!settings) {
    settings = await this.create({
      takeawayDiscount: DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS,
    });
  }

  settings.takeawayDiscount = sanitizeTakeawayDiscountSettings(settings.takeawayDiscount);

  return settings;
};

const DiscountSettings: DiscountSettingsModel =
  (mongoose.models.DiscountSettings as DiscountSettingsModel) ||
  mongoose.model<DiscountSettingsDocument, DiscountSettingsModel>(
    "DiscountSettings",
    discountSettingsSchema
  );

export default DiscountSettings;
