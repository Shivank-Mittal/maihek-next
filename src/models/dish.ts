import mongoose, { Document, Model, Schema } from "mongoose";

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
  includes?: string[];
  sizes?: { size: string; price: number }[];
  image?: string;
  variations?: string[];
  active?: boolean;
};
