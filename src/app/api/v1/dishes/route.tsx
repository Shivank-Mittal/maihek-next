import connectDB from "@/lib/db";
import { Dish, DishInput } from "@/models/dish";
import ApiResponse from "@/lib/response";
import Category from "@/models/category";
import { ObjectId } from "mongodb";
import { sanitizeDishDiscount } from "@/lib/checkout";

async function resolveCategory(categoryName?: string, categoryId?: string) {
  if (categoryName) {
    return Category.findOne({ name: categoryName });
  }

  if (categoryId) {
    return Category.findById(categoryId);
  }

  return null;
}

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

    const { category, categoryId, dishes } = body;
    const categoryDocument = await resolveCategory(category, categoryId);

    if (!categoryDocument) {
      return ApiResponse.badRequest("Category is required");
    }

    if (dishes) {
      const dishesArray = Array.isArray(dishes) ? dishes : [dishes];
      const invalidDish = dishesArray.some(
        (dish: DishInput) => !dish.name || dish.price === undefined || !dish.description
      );

      if (invalidDish) {
        return ApiResponse.badRequest("Each dish must include 'name', 'price', and 'description'");
      }

      const dishesWithCategory = dishesArray.map((dish: DishInput) => ({
        ...dish,
        discount: sanitizeDishDiscount(dish.discount),
        active: dish.active ?? true,
        category: categoryDocument._id,
      }));

      await Dish.insertMany(dishesWithCategory);

      return ApiResponse.created({ message: "Dish(es) created successfully" });
    }

    const { name, price, description, image, active = true, discount } = body;

    if (!name || price === undefined || !description) {
      return ApiResponse.badRequest("'name', 'price', and 'description' are required");
    }

    const createdDish = await Dish.create({
      name,
      price,
      description,
      image,
      active,
      discount: sanitizeDishDiscount(discount),
      category: categoryDocument._id,
    });

    return ApiResponse.created({
      message: "Dish created successfully",
      dish: {
        _id: createdDish._id,
        name: createdDish.name,
        price: createdDish.price,
        description: createdDish.description,
        image: createdDish.image,
        active: createdDish.active,
        discount: createdDish.discount,
        category: categoryDocument.name,
      },
    });
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
