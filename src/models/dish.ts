import mongoose, { Document, Model, Schema } from "mongoose";
import type { DishDiscount } from "@repo-types/dishes";

const dishSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
  },
  image: {
    type: String,
  },
  discount: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  sizes: [
    {
      size: String,
      price: Number,
    },
  ],
  variations: [String],
  includes: [{ type: String }],
  active: {
    type: Boolean,
    default: true,
  },
});

export interface DishDocument extends Document {
  name: string;
  description: string; // single description property
  price: number;
  discount?: DishDiscount | null;
  category: string;
  includes: string[];
  sizes: { size: string; price: number }[];
  image: string;
  variations: string[];
  active: boolean;
}

export interface DishModel extends Model<DishDocument> {}

export const Dish =
  mongoose.models.Dish || mongoose.model<DishDocument, DishModel>("Dish", dishSchema);

export type DishInput = {
  _id?: string;
  name: string;
  description: string; // required in DishInput
  category: string;
  price: number;
  discount?: DishDiscount | null;
  includes?: string[];
  sizes?: { size: string; price: number }[];
  image?: string;
  variations?: string[];
  active?: boolean;
};
