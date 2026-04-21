export interface Ingredient {
  amount: number | null;
  unit: string | null;
  name: string;
  search?: string;
  weight_g?: number | null;
}

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface IngredientNutrition {
  name: string;
  weight_g: number;
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  source: string | null;
}

export interface ImageTransform {
  scale: number;
  translateX: number;
  translateY: number;
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
  ingredientNutrition?: IngredientNutrition[];
  totalRecipe?: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    weight_g: number;
  };
  allergens: string[];
  thumbnail?: string;
  imageUrl?: string;
  imageTransform?: ImageTransform;
  tags?: string[];
  notes?: string;
  rating?: number;
  cookbook?: string;
  sourceUrl: string;
  creatorPlatform?: string;
  creatorHandle?: string;
  creatorUrl?: string;
  createdAt: string;
}
