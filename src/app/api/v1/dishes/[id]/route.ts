import connectDB from "@/lib/db";
import { Dish } from "@/models/dish";
import Category from "@/models/category";
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
    const { name, price, image, description, active, category } = body;

    if (!body || typeof body !== "object" || Object.keys(body).length === 0) {
      return ApiResponse.badRequest("At least one field is required");
    }

    const updateFields: Record<string, unknown> = {};

    if (name !== undefined) updateFields.name = name;
    if (price !== undefined) updateFields.price = price;
    if (image !== undefined) updateFields.image = image;
    if (description !== undefined) updateFields.description = description;
    if (active !== undefined) updateFields.active = active;

    if (category !== undefined) {
      const existingCategory = await Category.findOne({ name: category });

      if (!existingCategory) {
        return ApiResponse.badRequest("Category not found");
      }

      updateFields.category = existingCategory._id;
    }

    if (Object.keys(updateFields).length === 0) {
      return ApiResponse.badRequest("No valid fields provided for update");
    }

    await Dish.updateOne(
      { _id: id },
      {
        $set: updateFields,
      }
    );

    return ApiResponse.ok({ message: "Dish updated successfully" });
  } catch (error: any) {
    console.error("Error in PATCH /api/v1/dishes/[id]:", error);
    return ApiResponse.internalServerError(error.message);
  }
}
