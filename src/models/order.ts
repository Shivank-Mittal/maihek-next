import mongoose, { Document, Schema } from "mongoose";

const orderItemAddonSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
  },
  { _id: false }
);

const orderItemSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    _subtotal: { type: Number, required: true },
    addons: { type: [orderItemAddonSchema], default: [] },
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
  stripeSessionId: { type: String, sparse: true, unique: true },
  paymentMethod: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now, expires: 604800 },
});

export interface OrderItemAddonDocument {
  name: string;
  price: number;
  quantity: number;
}

export interface OrderItemDocument {
  name: string;
  price: number;
  quantity: number;
  _subtotal: number;
  addons?: OrderItemAddonDocument[];
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
  paymentMethod: string;
  createdAt: Date;
}

export const Order =
  mongoose.models.Order || mongoose.model<OrderDocument>("Order", orderSchema);
