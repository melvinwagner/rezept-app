import AsyncStorage from "@react-native-async-storage/async-storage";
import { Recipe } from "../types/recipe";

const RECIPES_KEY = "saved_recipes";

export async function saveRecipe(recipe: Recipe): Promise<void> {
  const existing = await getRecipes();
  existing.unshift(recipe);
  await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(existing));
}

export async function getRecipes(): Promise<Recipe[]> {
  const data = await AsyncStorage.getItem(RECIPES_KEY);
  if (!data) return [];
  return JSON.parse(data);
}

export async function deleteRecipe(id: string): Promise<void> {
  const recipes = await getRecipes();
  const filtered = recipes.filter((r) => r.id !== id);
  await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(filtered));
}
