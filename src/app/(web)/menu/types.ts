export interface Dish {
  _id: string;
  name: string;
  price: number;
  description: string;
  includes?: string[];
  sizes?: { size: string; price: number }[];
  image?: string;
  __v: number;
}

export interface Category {
  _id: string;
  name: string;
  dishes?: Dish[];
}
