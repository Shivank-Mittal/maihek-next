import type {
  AdminDish,
  ApiDish,
  ApiDishCategory,
  ApiResponse,
  CreateDishInput,
  DishCategoryOption,
  DishCategory,
  MenuDish,
  PatchDishInput,
} from "@repo-types/dishes";

const DISHES_ENDPOINT = "/api/v1/dishes";

export async function listCategoryOptions(): Promise<DishCategoryOption[]> {
  const categories = await listDishCategories();

  return categories.map((category) => ({
    name: category.name,
  }));
}

export async function listDishCategories(): Promise<DishCategory[]> {
  const response = await fetch(DISHES_ENDPOINT);
  const categories = await parseResponse<ApiDishCategory[]>(response);

  return categories.map(normalizeCategory);
}

export async function listAdminDishes(): Promise<AdminDish[]> {
  const categories = await listDishCategories();

  return categories.flatMap((category) =>
    category.dishes.map((dish) => ({
      ...dish,
      category: category.name,
    }))
  );
}

export async function createDish(input: CreateDishInput): Promise<void> {
  const response = await fetch(DISHES_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  await parseResponse<{ message: string }>(response);
}

export async function updateDish(id: string, input: PatchDishInput): Promise<void> {
  const response = await fetch(`${DISHES_ENDPOINT}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  await parseResponse<{ message: string }>(response);
}

export async function deleteDish(id: string): Promise<void> {
  const response = await fetch(`${DISHES_ENDPOINT}/${id}`, {
    method: "DELETE",
  });

  await parseResponse<{ message: string }>(response);
}

export async function updateDishSellingStatus(id: string, active: boolean): Promise<void> {
  await updateDish(id, { active });
}

function normalizeDish(dish: ApiDish): MenuDish {
  return {
    _id: dish._id,
    name: dish.name,
    price: dish.price,
    description: dish.description,
    image: dish.image,
    active: dish.active ?? true,
    includes: Array.isArray(dish.includes) ? dish.includes : [],
    sizes: Array.isArray(dish.sizes) ? dish.sizes : [],
    variations: Array.isArray(dish.variations) ? dish.variations : [],
  };
}

function normalizeCategory(category: ApiDishCategory): DishCategory {
  return {
    _id: category._id,
    name: category.name,
    dishes: Array.isArray(category.dishes) ? category.dishes.map(normalizeDish) : [],
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  let payload: ApiResponse<T> | null = null;

  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
  }

  if (!response.ok) {
    throw new Error(
      payload && !payload.success ? payload.error : `Request failed with status ${response.status}`
    );
  }

  if (!payload || !payload.success) {
    throw new Error(payload && !payload.success ? payload.error : "Unexpected API response");
  }

  return payload.data;
}