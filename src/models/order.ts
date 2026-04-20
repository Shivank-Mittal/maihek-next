import mongoose, { Document, Schema } from "mongoose";

const orderItemSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    _subtotal: { type: Number, required: true },
    option: { type: String, default: "" },
  },
  { _id: false }
);

const orderSchema = new Schema({
  customerName: { type: String, required: true },
  phone: { type: String, default: "" },
  email: { type: String, default: "" },
  deliveryAddress: { type: String, default: "" },
  addressPincode: { type: String, default: "" },
  addressInstructions: { type: String, default: "" },
  orderType: { type: String, enum: ["livraison", "emporter", ""], default: "" },
  items: [orderItemSchema],
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed"],
    default: "pending",
  },
  stripeSessionId: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export interface OrderItemDocument {
  name: string;
  price: number;
  quantity: number;
  _subtotal: number;
  option?: string;
}

export interface OrderDocument extends Document {
  customerName: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  addressPincode: string;
  addressInstructions: string;
  orderType: "livraison" | "emporter" | "";
  items: OrderItemDocument[];
  total: number;
  status: "pending" | "confirmed" | "completed";
  stripeSessionId: string;
  createdAt: Date;
}

export const Order =
  mongoose.models.Order || mongoose.model<OrderDocument>("Order", orderSchema);
