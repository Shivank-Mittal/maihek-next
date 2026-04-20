import mongoose, { Document, Schema } from "mongoose";

const pushSubscriptionSchema = new Schema({
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  createdAt: { type: Date, default: Date.now },
});

export interface PushSubscriptionDocument extends Document {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  createdAt: Date;
}

export const PushSubscription =
  mongoose.models.PushSubscription ||
  mongoose.model<PushSubscriptionDocument>("PushSubscription", pushSubscriptionSchema);
