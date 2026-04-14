export interface Recipe {
  id: string;
  title: string;
  description: string;
  servings: string;
  prepTime: string;
  cookTime: string;
  ingredients: string[];
  steps: string[];
  sourceUrl: string;
  createdAt: string;
}
