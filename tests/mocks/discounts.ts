import type { TakeawayDiscountSettings } from '@repo-types/discounts'
import type { AdminDish, DishCategoryOption } from '@repo-types/dishes'

// Mock categories for testing
export const mockCategories: DishCategoryOption[] = [
  { name: 'Pizza' },
  { name: 'Pasta' },
  { name: 'Desserts' },
]

// Mock dishes for testing
export const mockDishes: AdminDish[] = [
  {
    _id: 'dish1',
    name: 'Margherita Pizza',
    category: 'Pizza',
    price: 12,
    sizes: [],
    variations: [],
    includes: [],
    image: '',
    description: '',
    active: true,
  },
  {
    _id: 'dish2',
    name: 'Carbonara',
    category: 'Pasta',
    price: 15,
    sizes: [],
    variations: [],
    includes: [],
    image: '',
    description: '',
    active: true,
  },
]

// Mock takeaway discount settings
export const mockTakeawayDiscount: TakeawayDiscountSettings = {
  enabled: true,
  percentage: 10,
  excludedDishIds: [],
  excludedCategoryNames: [],
}

// Mock props for TakeawayDiscountCard component
export const mockTakeawayDiscountCardProps = {
  takeawayDiscount: mockTakeawayDiscount,
  categories: mockCategories,
  dishes: mockDishes,
  loading: false,
  onChange: jest.fn(),
  onSave: jest.fn(),
}