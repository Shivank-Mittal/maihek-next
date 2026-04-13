import connectDB from "@/lib/db";
import { Dish } from "@/models/dish";
import ApiResponse from "@/lib/response";
import { NextRequest } from "next/server";

interface Params {
  id: string;
}

export async function DELETE(req: NextRequest, context: { params: Promise<Params> }) {
  try {
    await connectDB();

    const { id } = await context.params;
    if (!id) return ApiResponse.badRequest("Dish id is required");

    const dish = await Dish.findOne({ _id: id });
    if (!dish) return ApiResponse.notFound("Dish not found");

    await Dish.deleteOne({ _id: id });
    return ApiResponse.ok({ message: "Dish deleted successfully" });
  } catch (error: any) {
    console.error("Error in DELETE /api/v1/dishes/[id]:", error);
    return ApiResponse.internalServerError(error.message);
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<Params> }) {
  try {
    await connectDB();

    const { id } = await context.params;
    if (!id) return ApiResponse.badRequest("Dish id is required");

    const dish = await Dish.findById(id);
    if (!dish) return ApiResponse.notFound("Dish not found");

    const body = await req.json();
    const { name, price, image, description, active } = body;

    if (!name || !price || !image || !description) {
      return ApiResponse.badRequest("All fields are required including 'active'");
    }

    await Dish.updateOne(
      { _id: id },
      {
        $set: {
          name,
          price,
          image,
          description,
          active: active === undefined ? dish.active : active,
        },
      }
    );

    return ApiResponse.ok({ message: "Dish updated successfully" });
  } catch (error: any) {
    console.error("Error in PATCH /api/v1/dishes/[id]:", error);
    return ApiResponse.internalServerError(error.message);
  }
}
