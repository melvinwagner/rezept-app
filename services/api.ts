import { Platform } from "react-native";
import Constants from "expo-constants";
import { Recipe, Ingredient, Macros } from "../types/recipe";
import { supabase } from "./supabase";

const BASE_URL =
  (Constants.expoConfig?.extra?.apiUrl as string) || "http://localhost:3001";
const PROXY_URL = `${BASE_URL}/api/generate-recipe`;

function parseCreatorFromUrl(url: string): {
  platform?: string;
  handle?: string;
  profileUrl?: string;
} {
  try {
    const tiktokMatch = url.match(/tiktok\.com\/@([^/?#]+)/i);
    if (tiktokMatch) {
      const handle = tiktokMatch[1];
      return { platform: "TikTok", handle: `@${handle}`, profileUrl: `https://www.tiktok.com/@${handle}` };
    }
    const instaMatch = url.match(/instagram\.com\/([^/?#]+)\/(reel|p|reels)\//i);
    if (instaMatch) {
      const handle = instaMatch[1];
      return { platform: "Instagram", handle: `@${handle}`, profileUrl: `https://www.instagram.com/${handle}/` };
    }
    const ytMatch = url.match(/youtube\.com\/@([^/?#]+)/i);
    if (ytMatch) {
      const handle = ytMatch[1];
      return { platform: "YouTube", handle: `@${handle}`, profileUrl: `https://www.youtube.com/@${handle}` };
    }
  } catch {}
  return {};
}

let API_KEY = "";
export function setApiKey(key: string) {
  API_KEY = key;
}

export function getApiKey(): string {
  return API_KEY;
}

export async function generateRecipe(videoUrl: string): Promise<Recipe> {
  const body: Record<string, string> = { videoUrl };
  if (API_KEY) body.apiKey = API_KEY;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) body.userId = user.id;
  } catch {}

  const response = await fetch(PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Server nicht erreichbar" }));
    throw new Error(error.error || `Fehler: ${response.status}`);
  }

  const parsed = await response.json();
  const creator = parseCreatorFromUrl(videoUrl);

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
    tags: parsed.tags || [],
    thumbnail: parsed.thumbnail || undefined,
    imageUrl: parsed.imageUrl || undefined,
    sourceUrl: videoUrl,
    creatorPlatform: creator.platform,
    creatorHandle: creator.handle,
    creatorUrl: creator.profileUrl,
    createdAt: new Date().toISOString(),
  };
}

export type BugCategory = "Bug" | "Feedback" | "Idee";

export async function reportBug(
  username: string,
  category: BugCategory,
  text: string,
): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/report-bug`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, category, text }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Server nicht erreichbar" }));
    throw new Error(err.error || `Fehler: ${response.status}`);
  }
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
