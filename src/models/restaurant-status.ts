import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITimeWindow {
  open: string; // "HH:MM"
  close: string; // "HH:MM"
}

export interface IRestaurantStatus extends Document {
  useSchedule: boolean;
  manualIsOpen: boolean;
  windows: ITimeWindow[];
  updatedAt: Date;
}

interface RestaurantStatusModel extends Model<IRestaurantStatus> {
  getStatus(): Promise<IRestaurantStatus>;
}

const TimeWindowSchema = new Schema<ITimeWindow>(
  {
    open: { type: String, required: true },
    close: { type: String, required: true },
  },
  { _id: false }
);

const RestaurantStatusSchema = new Schema<IRestaurantStatus>({
  useSchedule: { type: Boolean, default: false },
  manualIsOpen: { type: Boolean, default: true },
  windows: {
    type: [TimeWindowSchema],
    default: [
      { open: "11:45", close: "14:15" },
      { open: "18:30", close: "22:30" },
    ],
  },
  updatedAt: { type: Date, default: Date.now },
});

const DEFAULT_WINDOWS = [
  { open: "11:45", close: "14:15" },
  { open: "18:30", close: "22:30" },
];

RestaurantStatusSchema.statics.getStatus = async function () {
  let doc = await this.findOne({});
  if (!doc) {
    doc = await this.create({
      useSchedule: false,
      manualIsOpen: true,
      windows: DEFAULT_WINDOWS,
    });
  } else if (!doc.windows || doc.windows.length === 0) {
    // Migrate old document that was created before windows field existed
    doc = await this.findOneAndUpdate({}, { $set: { windows: DEFAULT_WINDOWS } }, { new: true });
  }
  return doc;
};

const RestaurantStatus: RestaurantStatusModel =
  (mongoose.models.RestaurantStatus as RestaurantStatusModel) ||
  mongoose.model<IRestaurantStatus, RestaurantStatusModel>(
    "RestaurantStatus",
    RestaurantStatusSchema
  );

export default RestaurantStatus;
