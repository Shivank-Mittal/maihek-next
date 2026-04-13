import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
});

export const User = mongoose.model("User", userSchema);

export type User = mongoose.Document & {
  name: string;
  email: string;
  password: string;
  role: string;
};
