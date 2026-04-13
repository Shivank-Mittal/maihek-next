import connectDB from "@/lib/db";
import Category from "@/models/category";
import ApiResponse from "@/lib/response";
export async function GET(req: any) {
  try {
    await connectDB();
    const categories = await Category.find().populate("dishes");
    return ApiResponse.ok(categories);
  } catch (error: any) {
    return ApiResponse.internalServerError(error.message || "Something went wrong");
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    let body;

    try {
      body = await req.json();
    } catch (error) {
      return ApiResponse.badRequest("Invalid JSON body");
    }

    // If it's an array: create multiple
    if (Array.isArray(body)) {
      const invalid = body.some((item) => !item.name);

      if (invalid) {
        return ApiResponse.badRequest("Each item must have 'name'");
      }

      const categories = body.map((item) => ({
        name: item.name,
        name_fr: item.name_fr,
      }));

      await Category.insertMany(categories);
      return ApiResponse.created({
        message: "Multiple categories created successfully",
      });
    }

    // Single object
    const { name } = body;

    if (!name) {
      return ApiResponse.badRequest("'name' is required");
    }

    const category = new Category({
      name,
    });

    await category.save();
    return ApiResponse.created({
      message: "Category created successfully",
    });
  } catch (error: any) {
    console.error(error);
    return ApiResponse.internalServerError(error.message || "Internal Server Error");
  }
}
