export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type DishSize = {
  size: string;
  price: number;
};

export type ApiDish = {
  _id: string;
  name: string;
  price: number;
  description: string;
  image?: string;
  active?: boolean;
  includes?: string[];
  sizes?: DishSize[];
  variations?: string[];
};

export type ApiDishCategory = {
  _id: string;
  name: string;
  dishes?: ApiDish[];
};

export interface MenuDish {
  _id: string;
  name: string;
  price: number;
  description: string;
  image?: string;
  active: boolean;
  includes: string[];
  sizes: DishSize[];
  variations: string[];
}

export interface DishCategory {
  _id: string;
  name: string;
  dishes: MenuDish[];
}

export interface AdminDish extends MenuDish {
  category: string;
}

export type UpdateDishInput = {
  name: string;
  price: number;
  description: string;
  image?: string;
  category: string;
  active: boolean;
};

export type PatchDishInput = Partial<UpdateDishInput>;