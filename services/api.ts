import { Platform } from "react-native";
import { Recipe, Ingredient, Macros } from "../types/recipe";

const BASE_URL = "http://localhost:3001";
const PROXY_URL = `${BASE_URL}/api/generate-recipe`;

let API_KEY = "";
export function setApiKey(key: string) {
  API_KEY = key;
}

export function getApiKey(): string {
  return API_KEY;
}

export async function generateRecipe(videoUrl: string): Promise<Recipe> {
  if (!API_KEY) {
    throw new Error("Bitte zuerst den API Key in den Einstellungen setzen.");
  }

  const response = await fetch(PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoUrl, apiKey: API_KEY }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Server nicht erreichbar" }));
    throw new Error(error.error || `Fehler: ${response.status}`);
  }

  const parsed = await response.json();

  return {
    id: Date.now().toString(),
    title: parsed.title,
    description: parsed.description,
    servings: parsed.servings,
    prepTime: parsed.prepTime,
    cookTime: parsed.cookTime,
    ingredients: parsed.ingredients,
    steps: parsed.steps,
    nutritionPerServing: parsed.nutritionPerServing,
    nutritionPer100g: parsed.nutritionPer100g,
    micronutrients: parsed.micronutrients || {},
    allergens: parsed.allergens || [],
    thumbnail: parsed.thumbnail || undefined,
    imageUrl: parsed.imageUrl || undefined,
    sourceUrl: videoUrl,
    createdAt: new Date().toISOString(),
  };
}

export async function recalculateNutrition(ingredients: Ingredient[], servings: number): Promise<{
  nutritionPerServing: Macros;
  nutritionPer100g: Macros;
  micronutrients: Record<string, string>;
}> {
  const response = await fetch(`${BASE_URL}/api/recalculate-nutrition`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ingredients, servings }),
  });

  if (!response.ok) {
    throw new Error("Nährwert-Berechnung fehlgeschlagen");
  }

  return response.json();
}
