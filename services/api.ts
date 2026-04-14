import { Platform } from "react-native";
import { Recipe } from "../types/recipe";

const PROXY_URL = Platform.OS === "web"
  ? "http://localhost:3001/api/generate-recipe"
  : "http://localhost:3001/api/generate-recipe";

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
    sourceUrl: videoUrl,
    createdAt: new Date().toISOString(),
  };
}
