export interface Ingredient {
  amount: number | null;
  unit: string | null;
  name: string;
  search?: string;
}

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  servings: number;
  prepTime: string;
  cookTime: string;
  ingredients: Ingredient[];
  steps: string[];
  nutritionPerServing: Macros;
  nutritionPer100g: Macros;
  micronutrients: Record<string, string>;
  allergens: string[];
  thumbnail?: string;
  imageUrl?: string;
  rating?: number;
  cookbook?: string;
  sourceUrl: string;
  createdAt: string;
}
