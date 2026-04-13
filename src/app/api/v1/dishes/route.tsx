import connectDB from "@/lib/db";
import { Dish, DishInput } from "@/models/dish";
import ApiResponse from "@/lib/response";
import Category from "@/models/category";
import { ObjectId } from "mongodb";

export async function GET(req: any) {
  try {
    await connectDB();

    const [categories, dishes] = await Promise.all([
      Category.find(),
      Dish.find().populate("category"),
    ]);

    const dishesByCategory = categories.map((cat) => {
      const catId = (cat._id as ObjectId).toString();

      const relatedDishes = dishes
        .filter((dish) => dish.category && dish.category._id.toString() === catId)
        .map((dish) => {
          const { category, ...rest } = dish.toObject();
          return rest; // exclude category to avoid redundancy
        });

      return {
        _id: cat._id,
        name: cat.name,
        dishes: relatedDishes,
      };
    });

    return ApiResponse.ok(dishesByCategory);
  } catch (error: any) {
    return ApiResponse.internalServerError(error.message, error.statusCode);
  }
}

export async function POST(req: any) {
  try {
    await connectDB();
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return ApiResponse.badRequest("Invalid JSON body");
    }
    const { category, dishes } = body;

    if (!category) {
      return ApiResponse.badRequest("Category is required");
    }

    if (!dishes) {
      return ApiResponse.badRequest("Dishes are required");
    }

    const dishesArray = Array.isArray(dishes) ? dishes : [dishes];

    // const invalid = dishesArray.some(
    //   (dish: DishInput) => !dish.name || !dish.price || !dish.description
    // );

    // if (invalid) {
    //   return ApiResponse.badRequest("Each dish must have 'name', 'price', 'description' ");
    // }
    const dishesWithCategory = dishesArray.map((dish: DishInput) => ({
      ...dish,
      category,
    }));
    await Dish.insertMany(dishesWithCategory);

    return ApiResponse.created({ message: "Dish(es) created successfully" });
  } catch (error: any) {
    console.error("Error in API route:", error);
    return ApiResponse.internalServerError(error.message, error.statusCode);
  }
}

export async function DELETE(req: any) {
  try {
    await connectDB();
    const { id } = req.params;
    await Dish.deleteOne({ _id: id });
    return ApiResponse.ok({ message: "Dish deleted successfully" });
  } catch (error: any) {
    console.error("Error in API route:", error);
    return ApiResponse.internalServerError(error.message, error.statusCode);
  }
}

export async function PUT(req: any) {
  try {
    await connectDB();
    const { id } = req.params;
    const body = await req.json();
    await Dish.updateOne({ _id: id }, { $set: body });
    return ApiResponse.ok({ message: "Dish updated successfully" });
  } catch (error: any) {
    console.error("Error in API route:", error);
    return ApiResponse.internalServerError(error.message, error.statusCode);
  }
}
