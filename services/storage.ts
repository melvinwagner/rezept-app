import AsyncStorage from "@react-native-async-storage/async-storage";
import { Recipe } from "../types/recipe";

const RECIPES_KEY = "saved_recipes";
const COOKBOOKS_KEY = "cookbooks";

// Rezepte
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

export async function updateRecipe(updated: Recipe): Promise<void> {
  const recipes = await getRecipes();
  const index = recipes.findIndex((r) => r.id === updated.id);
  if (index !== -1) {
    recipes[index] = updated;
    await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
  }
}

// Kochbücher
export async function getCookbooks(): Promise<string[]> {
  const data = await AsyncStorage.getItem(COOKBOOKS_KEY);
  if (!data) return [];
  return JSON.parse(data);
}

export async function addCookbook(name: string): Promise<void> {
  const existing = await getCookbooks();
  if (!existing.includes(name)) {
    existing.push(name);
    await AsyncStorage.setItem(COOKBOOKS_KEY, JSON.stringify(existing));
  }
}

export async function deleteCookbook(name: string): Promise<void> {
  const cookbooks = await getCookbooks();
  const filtered = cookbooks.filter((c) => c !== name);
  await AsyncStorage.setItem(COOKBOOKS_KEY, JSON.stringify(filtered));

  // Rezepte in diesem Kochbuch: cookbook-Feld entfernen
  const recipes = await getRecipes();
  const updated = recipes.map((r) =>
    r.cookbook === name ? { ...r, cookbook: undefined } : r
  );
  await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(updated));
}
