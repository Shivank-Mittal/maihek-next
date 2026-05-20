import mongoose, { Document, Model, Schema } from "mongoose";

export interface AddonSettingsDocument extends Document {
  globalEnabled: boolean;
  excludedCategoryNames: string[];
  excludedDishIds: string[];
  dishExcludedAddonIds: Map<string, string[]>;
  updatedAt: Date;
}

interface AddonSettingsModel extends Model<AddonSettingsDocument> {
  getSettings(): Promise<AddonSettingsDocument>;
}

const addonSettingsSchema = new Schema<AddonSettingsDocument>({
  globalEnabled: { type: Boolean, default: true },
  excludedCategoryNames: { type: [String], default: [] },
  excludedDishIds: { type: [String], default: [] },
  dishExcludedAddonIds: { type: Map, of: [String], default: {} },
  updatedAt: { type: Date, default: Date.now },
});

addonSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({});

  if (!settings) {
    settings = await this.create({
      globalEnabled: true,
      excludedCategoryNames: [],
      excludedDishIds: [],
      dishExcludedAddonIds: {},
    });
  }

  return settings;
};

const AddonSettings: AddonSettingsModel =
  (mongoose.models.AddonSettings as AddonSettingsModel) ||
  mongoose.model<AddonSettingsDocument, AddonSettingsModel>(
    "AddonSettings",
    addonSettingsSchema
  );

export default AddonSettings;
