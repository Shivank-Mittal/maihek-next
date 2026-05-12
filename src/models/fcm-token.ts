import mongoose, { Document, Schema } from "mongoose";

const fcmTokenSchema = new Schema({
  token: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

export interface FcmTokenDocument extends Document {
  token: string;
  createdAt: Date;
}

export const FcmToken =
  mongoose.models.FcmToken ||
  mongoose.model<FcmTokenDocument>("FcmToken", fcmTokenSchema);
