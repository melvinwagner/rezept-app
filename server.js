require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

const app = express();
app.set("trust proxy", 1); // Railway/Proxy: liefert client-IP im X-Forwarded-For
app.use(cors());
app.use(express.json());

// Rate-Limit: 100 Rezept-Generierungen pro IP pro 24h.
const recipeLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      "Tageslimit erreicht (100 Rezepte/Tag). Probier es morgen wieder.",
  },
});

const nodemailer = require("nodemailer");
const { createClient } = require("@supabase/supabase-js");
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const USDA_API_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
const USDA_API_KEY = process.env.USDA_API_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "";
const OFF_SEARCH_URL = "https://world.openfoodfacts.org/api/v2/search";
const OFF_USER_AGENT = "RezeptApp/1.0 (melvin.wagner97@gmail.com)";

// Supabase Admin-Client für serverseitiges Event-Logging (bypasst RLS via service_role).
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

function detectPlatform(url) {
  if (/tiktok\.com/i.test(url)) return "tiktok";
  if (/instagram\.com/i.test(url)) return "instagram";
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  return "other";
}

async function logUsageEvent(userId, event, metadata = {}) {
  if (!supabaseAdmin) return;
  try {
    const { error } = await supabaseAdmin.from("usage_events").insert({
      user_id: userId || null,
      event,
      metadata,
    });
    if (error) console.error("Usage log error:", error.message);
  } catch (err) {
    console.error("Usage log failed:", err.message);
  }
}

// Umrechnungstabelle: Einheit -> Gramm
const UNIT_TO_GRAMS = {
  g: 1,
  kg: 1000,
  ml: 1, // Näherung: 1ml ≈ 1g für die meisten Lebensmittel
  l: 1000,
  el: 15,
  tl: 5,
  "stück": 50, // Fallback-Schätzung
  prise: 0.5,
  scheibe: 30,
  zehe: 5,
};

function unitToGrams(amount, unit) {
  if (!amount) return 0;
  if (!unit) return amount; // assume grams if no unit
  const key = unit.toLowerCase().replace(".", "");
  return amount * (UNIT_TO_GRAMS[key] || 1);
}

function cleanIngredientName(name) {
  return name
    .replace(/\(.*?\)/g, "")
    .replace(/,.*$/, "")
    .replace(/\b(frisch|frische|frischer|gehackt|gehackte|gerieben|geriebener|geschnitten|geschnittene|dünn|fein|grob|nach Wahl|nach Geschmack|nach Belieben|optional|Zimmertemperatur|zum Garnieren|zum Servieren|oder|und|etwas|circa|ca)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(w => w.length > 1)
    .slice(0, 2)
    .join(" ");
}

// Nutrient IDs in USDA
const NUTRIENT_IDS = {
  kcal: [1008, 2047, 2048],
  protein: [1003],
  fat: [1004],
  carbs: [1005],
  fiber: [1079],
};

const MICRO_NUTRIENT_IDS = {
  "Vitamin A": { ids: [1106], unit: "µg" },
  "Vitamin C": { ids: [1162], unit: "mg" },
  "Vitamin D": { ids: [1114], unit: "µg" },
  "Vitamin E": { ids: [1109], unit: "mg" },
  "Vitamin K": { ids: [1185], unit: "µg" },
  "Vitamin B6": { ids: [1175], unit: "mg" },
  "Vitamin B12": { ids: [1178], unit: "µg" },
  "Calcium": { ids: [1087], unit: "mg" },
  "Eisen": { ids: [1089], unit: "mg" },
  "Kalium": { ids: [1092], unit: "mg" },
  "Magnesium": { ids: [1090], unit: "mg" },
  "Zink": { ids: [1095], unit: "mg" },
  "Natrium": { ids: [1093], unit: "mg" },
  "Folsäure": { ids: [1177], unit: "µg" },
};

function extractNutrientValue(foodNutrients, nutrientIds) {
  for (const id of nutrientIds) {
    const found = foodNutrients.find(n => n.nutrientId === id);
    if (found && found.value != null) return found.value;
  }
  return 0;
}

async function lookupUSDA(searchTerm) {
  const url = `${USDA_API_URL}?query=${encodeURIComponent(searchTerm)}&dataType=Foundation,SR%20Legacy&pageSize=5&api_key=${USDA_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 429) {
      console.log("    USDA rate limit reached!");
      throw new Error("USDA_RATE_LIMIT");
    }
    return null;
  }

  const data = await response.json();
  if (!data.foods || data.foods.length === 0) return null;

  // Finde das beste Ergebnis
  const searchLower = searchTerm.toLowerCase();
  const food = data.foods.find(f => {
    const desc = (f.description || "").toLowerCase();
    return searchLower.split(" ").some(w => desc.includes(w));
  }) || data.foods[0];

  if (!food || !food.foodNutrients) return null;

  const n = food.foodNutrients;
  const micro = {};
  for (const [name, info] of Object.entries(MICRO_NUTRIENT_IDS)) {
    const val = extractNutrientValue(n, info.ids);
    if (val > 0) {
      micro[name] = { value: val, unit: info.unit };
    }
  }

  return {
    kcal: extractNutrientValue(n, NUTRIENT_IDS.kcal),
    protein: extractNutrientValue(n, NUTRIENT_IDS.protein),
    carbs: extractNutrientValue(n, NUTRIENT_IDS.carbs),
    fat: extractNutrientValue(n, NUTRIENT_IDS.fat),
    fiber: extractNutrientValue(n, NUTRIENT_IDS.fiber),
    micro,
    source: `USDA: ${food.description}`,
  };
}

async function lookupOFF(searchTerm) {
  const url = `${OFF_SEARCH_URL}?search_terms=${encodeURIComponent(searchTerm)}&page_size=5&fields=product_name,nutriments`;
  const response = await fetch(url, {
    headers: { "User-Agent": OFF_USER_AGENT },
  });
  if (!response.ok) return null;

  const data = await response.json();
  if (!data.products || data.products.length === 0) return null;

  const product = data.products.find(p => p.nutriments && p.nutriments["energy-kcal_100g"] != null);
  if (!product) return null;

  const nm = product.nutriments;
  const micro = {};
  const microMap = {
    "Vitamin A": "vitamin-a_100g",
    "Vitamin C": "vitamin-c_100g",
    "Calcium": "calcium_100g",
    "Eisen": "iron_100g",
    "Kalium": "potassium_100g",
    "Magnesium": "magnesium_100g",
    "Natrium": "sodium_100g",
  };
  for (const [name, key] of Object.entries(microMap)) {
    if (nm[key] && nm[key] > 0) {
      const unit = ["Vitamin A"].includes(name) ? "µg" : "mg";
      micro[name] = { value: nm[key] * (unit === "mg" ? 1000 : 1000000), unit };
    }
  }

  return {
    kcal: nm["energy-kcal_100g"] || 0,
    protein: nm["proteins_100g"] || 0,
    carbs: nm["carbohydrates_100g"] || 0,
    fat: nm["fat_100g"] || 0,
    fiber: nm["fiber_100g"] || 0,
    micro,
    source: `OFF: ${product.product_name}`,
  };
}

// In-Memory Cache für Nährwert-Lookups
const nutritionCache = new Map();

// In-Memory Cache für komplette Rezepte (Deterministik über Geräte hinweg).
// Key = sha256(videoUrl). Gleiches Video → gleiches Rezept, solange Cache lebt.
const recipeCache = new Map();
const RECIPE_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 Tage

function recipeCacheKey(videoUrl) {
  return crypto.createHash("sha256").update(videoUrl.trim()).digest("hex");
}

function getCachedRecipe(videoUrl) {
  const entry = recipeCache.get(recipeCacheKey(videoUrl));
  if (!entry) return null;
  if (Date.now() - entry.ts > RECIPE_CACHE_TTL_MS) {
    recipeCache.delete(recipeCacheKey(videoUrl));
    return null;
  }
  return entry.recipe;
}

function setCachedRecipe(videoUrl, recipe) {
  recipeCache.set(recipeCacheKey(videoUrl), { ts: Date.now(), recipe });
}

async function lookupNutrition(ingredient) {
  const searchTerm = ingredient.search || cleanIngredientName(ingredient.name);
  if (!searchTerm) return null;

  // Cache prüfen
  if (nutritionCache.has(searchTerm)) {
    console.log(`    Cache hit: "${searchTerm}"`);
    return nutritionCache.get(searchTerm);
  }

  console.log(`    Searching for: "${searchTerm}" (from "${ingredient.name}")`);

  try {
    // Primär: USDA (beste Quelle für Grundzutaten)
    const usda = await lookupUSDA(searchTerm);
    if (usda && usda.kcal > 0) {
      nutritionCache.set(searchTerm, usda);
      return usda;
    }

    // Fallback: OpenFoodFacts (für verarbeitete Produkte)
    const off = await lookupOFF(searchTerm);
    if (off && off.kcal > 0) {
      nutritionCache.set(searchTerm, off);
      return off;
    }

    // Nur cachen wenn es kein Rate-Limit Problem war
    nutritionCache.set(searchTerm, null);
    return null;
  } catch (err) {
    // Bei Rate-Limit NICHT cachen, damit es beim nächsten Mal erneut versucht wird
    if (err.message === "USDA_RATE_LIMIT") {
      console.error(`  USDA rate limited for "${searchTerm}", not caching`);
    } else {
      console.error(`  Lookup failed for "${searchTerm}":`, err.message);
    }
    return null;
  }
}

async function calculateNutrition(ingredients, servings) {
  console.log("Calculating nutrition from OpenFoodFacts...");

  const totals = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  const microTotals = {};
  let totalWeightG = 0;
  const perIngredient = []; // Pro-Zutat-Breakdown für Client-Anzeige

  // Alle Zutaten parallel abfragen
  const results = await Promise.all(
    ingredients.map(async (ing) => ({
      ing,
      nutrition: await lookupNutrition(ing),
    }))
  );

  for (const { ing, nutrition } of results) {
    // Bevorzuge weight_g (Claude-geschätzt, zutatenspezifisch); Fallback: alte UnitToGrams-Tabelle.
    const weightG =
      typeof ing.weight_g === "number" && ing.weight_g > 0
        ? ing.weight_g
        : unitToGrams(ing.amount, ing.unit);

    if (!nutrition) {
      console.log(`  No nutrition data for: ${ing.name}`);
      perIngredient.push({
        name: ing.name,
        weight_g: weightG,
        kcal: null,
        protein: null,
        carbs: null,
        fat: null,
        source: null,
      });
      continue;
    }

    const factor = weightG / 100;
    const ingKcal = Math.round(nutrition.kcal * factor);

    console.log(`  ${ing.name}: ${weightG}g, ${ingKcal} kcal (source: ${nutrition.source})`);

    perIngredient.push({
      name: ing.name,
      weight_g: weightG,
      kcal: ingKcal,
      protein: Math.round(nutrition.protein * factor * 10) / 10,
      carbs: Math.round(nutrition.carbs * factor * 10) / 10,
      fat: Math.round(nutrition.fat * factor * 10) / 10,
      source: nutrition.source || null,
    });

    totals.kcal += nutrition.kcal * factor;
    totals.protein += nutrition.protein * factor;
    totals.carbs += nutrition.carbs * factor;
    totals.fat += nutrition.fat * factor;
    totals.fiber += nutrition.fiber * factor;
    totalWeightG += weightG;

    for (const [name, data] of Object.entries(nutrition.micro || {})) {
      if (data && data.value > 0) {
        microTotals[name] = microTotals[name] || { total: 0, unit: data.unit };
        microTotals[name].total += data.value * factor;
      }
    }
  }

  // GESAMT (Single Source of Truth — alles andere wird davon abgeleitet)
  const totalRecipe = {
    kcal: Math.round(totals.kcal),
    protein: Math.round(totals.protein * 10) / 10,
    carbs: Math.round(totals.carbs * 10) / 10,
    fat: Math.round(totals.fat * 10) / 10,
    fiber: Math.round(totals.fiber * 10) / 10,
    weight_g: Math.round(totalWeightG),
  };

  // EU-Standard Hauptmahlzeit: ≈ 750 kcal UND ≈ 400g/Person.
  // Dualer Check (kcal + Gewicht) verhindert Über-Teilung bei fett-/kalorienreichen
  // Rezepten (z.B. Loaded Fries: hohe kcal, aber geteiltes Party-Gericht).
  // Zusätzlich harte Obergrenze von 6 Portionen für typische Haushalts-Rezepte.
  const EU_MAIN_MEAL_KCAL = 750;
  const EU_MAIN_MEAL_WEIGHT_G = 400;
  const MAX_REASONABLE_SERVINGS = 6;

  const claudeKcalPerPortion = servings > 0 ? totals.kcal / servings : 0;
  const claudeSeemsReasonable =
    servings > 0 && claudeKcalPerPortion >= 250 && claudeKcalPerPortion <= 1300;

  let effectiveServings;
  if (claudeSeemsReasonable) {
    effectiveServings = servings;
  } else {
    const byKcal = Math.max(1, Math.round(totals.kcal / EU_MAIN_MEAL_KCAL));
    const byWeight = totalWeightG > 0
      ? Math.max(1, Math.round(totalWeightG / EU_MAIN_MEAL_WEIGHT_G))
      : byKcal;
    // Kleinere Zahl ≙ weniger teilen ≙ größere Portionen (konservativer).
    effectiveServings = Math.min(byKcal, byWeight, MAX_REASONABLE_SERVINGS);
  }

  // Pro Portion (für Backward-Compat — Client berechnet live aus totalRecipe)
  const perServing = {
    kcal: Math.round(totals.kcal / effectiveServings),
    protein: Math.round(totals.protein / effectiveServings),
    carbs: Math.round(totals.carbs / effectiveServings),
    fat: Math.round(totals.fat / effectiveServings),
    fiber: Math.round((totals.fiber / effectiveServings) * 10) / 10,
  };

  // Pro 100g
  const per100g = totalWeightG > 0 ? {
    kcal: Math.round(totals.kcal / totalWeightG * 100),
    protein: Math.round(totals.protein / totalWeightG * 100),
    carbs: Math.round(totals.carbs / totalWeightG * 100),
    fat: Math.round(totals.fat / totalWeightG * 100),
    fiber: Math.round((totals.fiber / totalWeightG * 100) * 10) / 10,
  } : perServing;

  // Mikronährstoffe pro Portion formatieren
  const microPerServing = {};
  for (const [name, data] of Object.entries(microTotals)) {
    const perS = data.total / effectiveServings;
    if (perS >= 1) {
      microPerServing[name] = `${Math.round(perS)} ${data.unit}`;
    } else if (perS > 0) {
      microPerServing[name] = `${perS.toFixed(1)} ${data.unit}`;
    }
  }

  console.log(
    `  Total: ${totalRecipe.kcal} kcal · Claude-servings=${servings} (${Math.round(claudeKcalPerPortion)} kcal/p) · effective=${effectiveServings} → ${perServing.kcal} kcal/Portion`
  );

  return {
    perServing,
    per100g,
    microPerServing,
    perIngredient,
    totalRecipe,
    effectiveServings,
  };
}

async function searchFoodImage({ imageQuery, title, description }) {
  if (!PEXELS_API_KEY) return null;

  // Claude-generierte image_query bevorzugen. Fallback: title + keywords aus description.
  const queries = [];
  if (imageQuery && imageQuery.trim()) {
    queries.push(imageQuery.trim());
  }
  if (title) {
    const cleanTitle = title.replace(/[^\w\s]/g, "").trim();
    queries.push(`${cleanTitle} dish`);
  }
  if (description) {
    const descKeywords = description
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 4)
      .join(" ");
    if (descKeywords) queries.push(descKeywords);
  }

  for (const q of queries) {
    try {
      const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=3&orientation=portrait`;
      const response = await fetch(url, {
        headers: { Authorization: PEXELS_API_KEY },
      });
      if (!response.ok) continue;
      const data = await response.json();
      if (data.photos && data.photos.length > 0) {
        console.log(`  Pexels-Hit für "${q}" (${data.photos.length} results)`);
        return data.photos[0].src.medium;
      }
      console.log(`  Pexels-Miss für "${q}"`);
    } catch (err) {
      console.error(`  Pexels search failed for "${q}":`, err.message);
    }
  }
  return null;
}

function getVideoCaption(videoUrl) {
  return new Promise((resolve, reject) => {
    execFile(
      "yt-dlp",
      [
        "--skip-download",
        "--print", "%(description)s",
        videoUrl,
      ],
      { timeout: 30000 },
      (error, stdout, stderr) => {
        if (error) {
          console.error("yt-dlp caption error:", stderr);
          resolve(null);
          return;
        }
        const caption = stdout.trim();
        if (caption && caption !== "NA" && caption.length > 0) {
          resolve(caption);
        } else {
          resolve(null);
        }
      }
    );
  });
}

function downloadSubtitles(videoUrl, tmpDir) {
  return new Promise((resolve, reject) => {
    const outputTemplate = path.join(tmpDir, "video");

    execFile(
      "yt-dlp",
      [
        "--write-subs",
        "--write-auto-sub",
        "--sub-lang", "deu-DE,de,eng-US,en",
        "--skip-download",
        "--output", outputTemplate,
        videoUrl,
      ],
      { timeout: 30000 },
      (error, stdout, stderr) => {
        if (error) {
          console.error("yt-dlp subtitle error:", stderr);
          reject(new Error("Untertitel konnten nicht heruntergeladen werden."));
          return;
        }

        // Find any subtitle file
        const files = fs.readdirSync(tmpDir);
        const subFile = files.find((f) => f.endsWith(".vtt") || f.endsWith(".srt"));
        if (subFile) {
          const content = fs.readFileSync(path.join(tmpDir, subFile), "utf-8");
          resolve(content);
        } else {
          resolve(null);
        }
      }
    );
  });
}

function downloadAudio(videoUrl, tmpDir) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(tmpDir, "audio.%(ext)s");

    console.log("Fallback: Downloading audio...");
    execFile(
      "yt-dlp",
      [
        "--extract-audio",
        "--audio-format", "mp3",
        "--audio-quality", "5",
        "--no-playlist",
        "--output", outputPath,
        videoUrl,
      ],
      { timeout: 60000 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Audio-Download fehlgeschlagen: ${stderr || error.message}`));
          return;
        }
        const files = fs.readdirSync(tmpDir);
        const audioFile = files.find((f) =>
          f.endsWith(".mp3") || f.endsWith(".m4a") || f.endsWith(".opus") || f.endsWith(".wav")
        );
        if (!audioFile) {
          reject(new Error("Keine Audiodatei gefunden."));
          return;
        }
        resolve(path.join(tmpDir, audioFile));
      }
    );
  });
}

async function transcribeAudio(audioPath) {

  const { Blob } = require("buffer");
  const audioData = fs.readFileSync(audioPath);
  const fileName = path.basename(audioPath);

  const formData = new FormData();
  formData.append("file", new Blob([audioData]), fileName);
  formData.append("model", "whisper-large-v3");
  formData.append("language", "de");
  formData.append("response_format", "text");

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Groq Whisper API error:", errorText);
    throw new Error("Transkription fehlgeschlagen: " + errorText);
  }

  const transcript = await response.text();
  if (!transcript || transcript.trim().length === 0) {
    throw new Error("Keine Sprache im Audio erkannt.");
  }
  return transcript.trim();
}

function parseVTT(vttContent) {
  // Strip VTT header and timestamps, extract just the text
  const lines = vttContent.split("\n");
  const textLines = [];
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines, WEBVTT header, and timestamp lines
    if (
      !trimmed ||
      trimmed === "WEBVTT" ||
      trimmed.includes("-->") ||
      /^\d+$/.test(trimmed)
    ) {
      continue;
    }
    textLines.push(trimmed);
  }
  return textLines.join(" ");
}

app.post("/api/generate-recipe", recipeLimiter, async (req, res) => {
  const { videoUrl, userId } = req.body;
  const apiKey = req.body.apiKey || process.env.CLAUDE_API_KEY;
  const startedAt = Date.now();
  const platform = videoUrl ? detectPlatform(videoUrl) : "other";

  if (!apiKey) {
    return res.status(500).json({ error: "Server ist nicht konfiguriert (kein Claude Key)." });
  }
  if (!videoUrl) {
    return res.status(400).json({ error: "Video URL fehlt." });
  }

  const cached = getCachedRecipe(videoUrl);
  if (cached) {
    console.log("Cache hit for videoUrl – returning cached recipe.");
    logUsageEvent(userId, "recipe_generated", {
      videoUrl,
      title: cached.title,
      platform,
      cached: true,
      duration_ms: Date.now() - startedAt,
    });
    return res.json(cached);
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rezept-"));

  try {
    // Step 1: Get video caption
    console.log("Step 1: Getting video caption...");
    const caption = await getVideoCaption(videoUrl);
    if (caption) {
      console.log("Got caption, length:", caption.length);
      console.log("Caption:", caption.substring(0, 300) + "...");
    } else {
      console.log("No caption available.");
    }

    // Step 2: Try to get subtitles
    console.log("Step 2: Trying to download subtitles...");
    let transcript = null;
    const subtitleContent = await downloadSubtitles(videoUrl, tmpDir);

    if (subtitleContent) {
      transcript = parseVTT(subtitleContent);
      console.log("Got subtitles, transcript length:", transcript.length);
    } else {
      console.log("No subtitles available, downloading audio for transcription...");
      try {
        const audioPath = await downloadAudio(videoUrl, tmpDir);
        console.log("Audio downloaded:", audioPath);
        transcript = await transcribeAudio(audioPath);
        console.log("Transcription complete, length:", transcript.length);
      } catch (audioErr) {
        console.error("Audio transcription failed:", audioErr.message);
        if (!caption) {
          return res.status(400).json({
            error: "Weder Caption, Untertitel noch Audio-Transkription verfügbar.",
          });
        }
      }
    }

    // Step 3: Send to Claude - caption is always primary source
    console.log("Step 3: Sending to Claude...");

    let contextParts = [];
    if (caption) {
      contextParts.push(`VIDEO-CAPTION (Beschreibung/Text unter dem Video):\n"${caption}"`);
    }
    if (transcript) {
      contextParts.push(`VIDEO-TRANSKRIPT (gesprochener Text / was im Video gesagt wird):\n"${transcript}"`);
    }

    const prompt = `Du bist ein Rezept-Experte. Hier sind die verfügbaren Informationen zu einem Rezeptvideo:

${contextParts.join("\n\n")}

Quelle: ${videoUrl}

REGELN:
- ZUTATENLISTE: Nimm die Zutaten und Mengenangaben/Einheiten AUS DER CAPTION. Die Caption ist die einzige Quelle für Zutaten und deren Mengen.
- KOCHANLEITUNG: Erstelle die Zubereitungsschritte AUS DEM VIDEO-TRANSKRIPT. Das Transkript zeigt was tatsächlich im Video gekocht/erklärt wird.
- Gleiche beide Quellen miteinander ab. Wenn das Transkript zusätzliche Details oder Tipps enthält, integriere diese in die Schritte.
- Falls nur eine Quelle vorhanden ist, nutze diese für beides.

SPRACHE & BEGRIFFE - WICHTIG:
- Rezept-Text komplett auf Deutsch.
- ABER: Etablierte englische Food-Begriffe NICHT übersetzen. Behalte im Original:
  Air Fryer, Meal Prep, Smoothie, Bowl, Dip, Wrap, Burger, Bun, Pulled Pork, Pulled Chicken, Wings, Nuggets, Brownies, Cookies, Cheesecake, Pancakes, Overnight Oats, Stir Fry, Ramen, Poke, Taco, Burrito, BBQ, Rub, Marinade, Glaze, Dressing, Topping, Crumble, Tempura, Pad Thai, Curry.
- Marken- und Eigennamen (z.B. Sriracha, Worcestershire, Parmesan) bleiben unverändert.
- Keine gezwungenen Eindeutschungen wie "Heißluftfritteuse", wenn "Air Fryer" geläufig ist.

EINHEITEN - WICHTIG:
- Alle Mengenangaben MÜSSEN in europäischen/metrischen Einheiten angegeben werden. Erlaubte Einheiten: "g", "kg", "ml", "l", "EL", "TL", "Stück", "Prise", "Scheibe", "Zehe", "Dose", "Bund", "Blatt", "Becher", "Packung", "Tropfen", "Spritzer", "Handvoll". KEINE anderen Einheiten.
- BEVORZUGE g oder ml gegenüber Stück/EL/TL, wann immer eine sinnvolle Gramm-Angabe möglich ist (z.B. "150 g Mehl" statt "1 Tasse Mehl").
- Rechne amerikanische Einheiten automatisch um: 1 cup Flüssigkeit = 240ml, 1 cup Mehl = 130g, 1 cup Zucker = 200g, 1 cup Butter = 225g, 1 cup Käse gerieben = 100g, 1 oz = 28g, 1 lb = 450g, 1 tbsp = 1 EL, 1 tsp = 1 TL, 1 stick Butter = 115g.
- Runde die Ergebnisse auf schöne, praktische Zahlen (z.B. 236ml → 240ml, 227g → 225g, 113g → 115g, 28g → 30g).
- Temperaturen in °C (falls Fahrenheit: (F-32) × 5/9, gerundet auf 5er-Schritte).
- "servings" MUSS eine Zahl sein (z.B. 2, nicht "2 Portionen").
- Jede Zutat MUSS ein Objekt sein mit "amount" (Zahl oder null), "unit" (String oder null), "name" (String) und "weight_g" (Zahl in Gramm oder null). Zutaten ohne Mengenangabe (z.B. "Salz nach Geschmack") haben amount: null, unit: null und weight_g: null.
- Zutatenreihenfolge: IMMER in der Reihenfolge, in der sie in der Caption erscheinen — nicht umsortieren.

WEIGHT_G - PFLICHT-SCHÄTZUNG:
- Für JEDE Zutat mit angegebener Menge MUSST du "weight_g" schätzen (Gesamtgewicht in Gramm der verwendeten Zutat).
- Wenn die Einheit bereits "g" oder "kg" oder "ml" oder "l" ist → weight_g = amount in Gramm umgerechnet (z.B. 200g → 200, 1kg → 1000, 240ml → 240, 1l → 1000).
- Bei "Stück" nutze typische Einzelgewichte: Ei 60g, Zwiebel 150g, große Zwiebel 200g, kleine Zwiebel 80g, Knoblauchzehe 5g, Apfel 180g, Tomate 100g, Kirschtomate 15g, Paprika 150g, Banane 120g, Kartoffel 150g, Möhre 80g, Zitrone 100g, Limette 60g, Orange 180g, Avocado 200g, Brötchen 60g, Baguette 250g, Ciabatta 250g.
- Bei "Scheibe": Brot 30g, Käse 25g, Tomate 8g, Wurst 15g, Zitrone 5g.
- Bei "Zehe": 5g (Knoblauch).
- Bei "EL" zutatenabhängig: Mehl 8g, Zucker 12g, Butter 15g, Öl 14ml≈14g, Honig 21g, Senf 15g, Joghurt 15g, Milch 15g, Tomatenmark 15g, Sahne 15g, Kakao 5g, Stärke 8g.
- Bei "TL" zutatenabhängig: Mehl 2.5g, Zucker 4g, Salz 5g, Backpulver 3g, Kreuzkümmel 2g, Paprikapulver 2g, Cayenne 2g, Zimt 2g, Öl 4.5g, Honig 7g, Vanilleextrakt 4g.
- Bei "Dose": Tomaten 400g, Mais 150g, Bohnen 240g (Abtropfgewicht), Kokosmilch 400g.
- Bei "Bund": 25g (Petersilie, Schnittlauch, Koriander, Basilikum).
- Bei "Blatt": 2g (Gelatine).
- Bei "Becher": Joghurt/Quark 150g, Sahne 200g.
- Bei "Packung": Nudeln 500g, Frischkäse 200g, Mehl 1000g, Reis 500g.
- Bei "Prise", "Spritzer", "Tropfen", "Handvoll": weight_g = null (zu klein für sinnvolle Nährwert-Berechnung).
- Wenn unsicher: realistisch konservativ schätzen, nicht übertreiben.

Antworte AUSSCHLIESSLICH mit validem JSON im folgenden Format, ohne Markdown-Codeblöcke oder zusätzlichen Text:

{
  "title": "Rezeptname",
  "description": "Kurze Beschreibung des Gerichts",
  "image_query": "food photography search phrase in english",
  "servings": 2,
  "prepTime": "z.B. 5 Min",
  "cookTime": "z.B. 8 Min",
  "ingredients": [{"amount": 200, "unit": "g", "name": "Zutat 1", "weight_g": 200, "search": "ingredient 1 english"}, {"amount": 1, "unit": "Stück", "name": "große Zwiebel", "weight_g": 200, "search": "onion"}, {"amount": 3, "unit": "EL", "name": "Butter", "weight_g": 45, "search": "butter"}, {"amount": null, "unit": null, "name": "Salz nach Geschmack", "weight_g": null, "search": "salt"}],
  "steps": ["Schritt 1 detailliert", "Schritt 2 detailliert"],
  "allergens": ["Gluten", "Milch"],
  "tags": ["vegetarisch"]
}

IMAGE_QUERY - PFLICHTFELD:
- "image_query" ist ein kurzer englischer Suchbegriff (3–7 Wörter) für die Pexels-Bildsuche.
- Beschreibe das fertige Gericht VISUELL mit spezifischen Keywords: Hauptzutat, Zubereitungsart, Präsentation.
- Nutze englische Standardbezeichnungen für die Küche (z.B. "italian pasta", "thai soup", "beef tacos").
- Beispiele:
  * Rezept "Loaded Fries mit Cheddar" → "loaded fries cheese bacon plate"
  * Rezept "Cacio e Pepe" → "italian cacio e pepe pasta bowl"
  * Rezept "Tom Yum Gung" → "thai tom yum soup shrimp bowl"
  * Rezept "Shakshuka mit Feta" → "shakshuka eggs tomato skillet feta"
  * Rezept "Avocado Toast" → "avocado toast sourdough bread"
- KEINE generischen Wörter wie "recipe", "cooking", "food" (Pexels braucht spezifische Keywords).
- KEINE Satzzeichen, kein "with", keine Artikel.

HINWEIS zu Zutaten:
- Jede Zutat MUSS ein "search"-Feld enthalten: ein kurzer englischer Suchbegriff für die USDA-Nährwertdatenbank.
- REGELN für "search":
  - Immer lowercase.
  - Immer Singular ("shallot" statt "shallots", "tomato" statt "tomatoes", "chicken breast" statt "chicken breasts").
  - Genau 1–2 Wörter, nur das reine Lebensmittel.
  - KEINE Adjektive zu Zubereitung, Zustand, Marke, Herkunft ("raw", "fresh", "cooked", "organic", "italian" etc. weglassen — außer sie sind Teil des Produktnamens wie "heavy cream" oder "olive oil").
  - Standard-Begriffe: "butter", "garlic", "olive oil", "heavy cream", "parmesan cheese", "spaghetti", "shallot", "onion", "tomato", "chicken breast", "ground beef", "white rice", "egg", "flour", "sugar", "salt", "pepper".

HINWEIS zu Allergenen:
- allergens: Liste ALLE enthaltenen Allergene auf (z.B. Gluten, Milch, Ei, Soja, Nüsse, Sellerie, Senf, Sesam, Lupine, Weichtiere, Krebstiere, Fisch, Erdnüsse, Schwefeldioxid).
- Prüfe jede Zutat sorgfältig auf bekannte Allergene.

HINWEIS zu Tags:
- tags: Array mit MAXIMAL einem der folgenden Werte, abhängig von den Zutaten:
  - "vegan" — KEIN tierisches Produkt (kein Fleisch, Fisch, Eier, Milchprodukte, Honig, Gelatine).
  - "vegetarisch" — kein Fleisch und kein Fisch, aber Milchprodukte und/oder Eier sind erlaubt.
  - Leeres Array [] wenn das Rezept Fleisch oder Fisch enthält.
- Wichtig: Prüfe jede Zutat einzeln. Ein einziges tierisches Produkt disqualifiziert "vegan". Fleisch oder Fisch disqualifizieren auch "vegetarisch".`;

    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        temperature: 0,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    let text = data.content[0].text;
    console.log("Claude response:", text);

    // Strip markdown code blocks if present
    text = text.replace(/^```json\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    const recipe = JSON.parse(text);

    // Step 4: Nährwerte aus OpenFoodFacts berechnen
    console.log("Step 4: Looking up nutrition from OpenFoodFacts...");
    try {
      const nutrition = await calculateNutrition(recipe.ingredients, recipe.servings);
      recipe.nutritionPerServing = nutrition.perServing;
      recipe.nutritionPer100g = nutrition.per100g;
      recipe.micronutrients = nutrition.microPerServing;
      recipe.ingredientNutrition = nutrition.perIngredient;
      recipe.totalRecipe = nutrition.totalRecipe;
      // Wenn Claude's servings unplausibel → auf EU-Standard überschreiben
      recipe.servings = nutrition.effectiveServings;
    } catch (nutritionErr) {
      console.error("Nutrition calculation failed:", nutritionErr.message);
      recipe.nutritionPerServing = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
      recipe.nutritionPer100g = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
      recipe.micronutrients = {};
      recipe.ingredientNutrition = [];
      recipe.totalRecipe = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, weight_g: 0 };
    }

    // Step 5: Food-Bild über Pexels anhand von image_query + title + description
    console.log("Step 5: Generating food image via Pexels...");
    console.log(`  image_query: "${recipe.image_query || "(none)"}"`);
    const generatedImage = await searchFoodImage({
      imageQuery: recipe.image_query,
      title: recipe.title,
      description: recipe.description,
    });
    recipe.imageUrl = generatedImage || null;
    recipe.thumbnail = generatedImage || null;
    if (generatedImage) {
      console.log("Got Pexels image:", generatedImage);
    } else {
      console.log("No Pexels image found — recipe has no image.");
    }

    setCachedRecipe(videoUrl, recipe);
    logUsageEvent(userId, "recipe_generated", {
      videoUrl,
      title: recipe.title,
      platform,
      cached: false,
      duration_ms: Date.now() - startedAt,
    });
    res.json(recipe);
  } catch (err) {
    console.error("Error:", err.message);
    logUsageEvent(userId, "recipe_generation_failed", {
      videoUrl,
      platform,
      error: err.message,
      duration_ms: Date.now() - startedAt,
    });
    res.status(500).json({ error: err.message });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// Endpoint: Nährwerte neu berechnen (nach Zutaten-Änderung)
app.post("/api/recalculate-nutrition", async (req, res) => {
  const { ingredients, servings } = req.body;
  if (!ingredients || !servings) {
    return res.status(400).json({ error: "ingredients und servings erforderlich." });
  }
  try {
    const nutrition = await calculateNutrition(ingredients, servings);
    res.json({
      nutritionPerServing: nutrition.perServing,
      nutritionPer100g: nutrition.per100g,
      micronutrients: nutrition.microPerServing,
      ingredientNutrition: nutrition.perIngredient,
      totalRecipe: nutrition.totalRecipe,
      effectiveServings: nutrition.effectiveServings,
    });
  } catch (err) {
    console.error("Recalculate error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: Bug-Report / Feedback → Monday-Board "Bugs und Fixes"
const MONDAY_API_URL = "https://api.monday.com/v2";
const MONDAY_BUGS_BOARD_ID = 5094884159;
const MONDAY_COL_USERNAME = "text_mm2jaft0";
const MONDAY_COL_CATEGORY = "color_mm2jtxdj";
const MONDAY_COL_DESCRIPTION = "long_text_mm2jyr2p";

const bugReportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Zu viele Bug-Reports. Versuch es später nochmal." },
});

app.post("/api/report-bug", bugReportLimiter, async (req, res) => {
  const { username, category, text } = req.body || {};
  const MONDAY_TOKEN = process.env.MONDAY_API_TOKEN;

  if (!MONDAY_TOKEN) {
    return res.status(500).json({ error: "Bug-Report ist nicht konfiguriert (Server)." });
  }
  if (!username || !category || !text) {
    return res.status(400).json({ error: "username, category und text erforderlich." });
  }

  const trimmedText = String(text).trim().slice(0, 2000);
  if (!trimmedText) {
    return res.status(400).json({ error: "Text darf nicht leer sein." });
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const itemName = `${category} · ${username} · ${dateStr}`;

  const columnValues = {
    [MONDAY_COL_USERNAME]: String(username).slice(0, 200),
    [MONDAY_COL_CATEGORY]: { label: String(category) },
    [MONDAY_COL_DESCRIPTION]: { text: trimmedText },
  };

  const mutation = `
    mutation($boardId: ID!, $name: String!, $columnValues: JSON!) {
      create_item(
        board_id: $boardId,
        item_name: $name,
        column_values: $columnValues,
        create_labels_if_missing: true
      ) { id }
    }
  `;

  try {
    const response = await fetch(MONDAY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": MONDAY_TOKEN,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          boardId: String(MONDAY_BUGS_BOARD_ID),
          name: itemName,
          columnValues: JSON.stringify(columnValues),
        },
      }),
    });

    const data = await response.json();
    if (data.errors) {
      console.error("Monday API errors:", data.errors);
      return res.status(502).json({ error: data.errors[0]?.message || "Monday API Fehler" });
    }

    console.log(`Bug report from ${username} (${category}) → Monday item ${data.data?.create_item?.id}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Bug report failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: Server-Keys exportieren
app.get("/api/server-keys", (req, res) => {
  res.json({
    groq: GROQ_API_KEY,
    usda: USDA_API_KEY,
    pexels: PEXELS_API_KEY,
  });
});

// Endpoint: Server-Keys importieren (schreibt .env)
app.post("/api/server-keys", (req, res) => {
  const { groq, usda, pexels } = req.body;
  const envContent = `GROQ_API_KEY=${groq || ""}\nUSDA_API_KEY=${usda || ""}\nPEXELS_API_KEY=${pexels || ""}\n`;
  fs.writeFileSync(path.join(__dirname, ".env"), envContent);
  // Auch zur Laufzeit setzen
  if (groq) process.env.GROQ_API_KEY = groq;
  if (usda) process.env.USDA_API_KEY = usda;
  if (pexels) process.env.PEXELS_API_KEY = pexels;
  res.json({ success: true });
});

// Endpoint: LocalSync per E-Mail senden
app.post("/api/send-sync", async (req, res) => {
  const { syncData } = req.body;
  if (!syncData) return res.status(400).json({ error: "Keine Sync-Daten." });

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "sneakerpaul01@gmail.com",
        pass: "nekwijgaupffjnwk",
      },
    });

    const recipeCount = syncData.recipes?.length || 0;
    const bookCount = syncData.cookbooks?.length || 0;
    const fileName = `localsync_${new Date().toISOString().slice(0, 10)}.json`;

    await transporter.sendMail({
      from: "Rezept App <sneakerpaul01@gmail.com>",
      to: "melvin.wagner97@gmail.com, paul.schlatte@gmail.com",
      subject: "Rezept App - LocalSync",
      text:
        `Rezept App - LocalSync\n\n` +
        `Stand: ${new Date().toLocaleDateString("de-DE")} | ${recipeCount} Rezepte | ${bookCount} Kategorien\n\n` +
        `=== Changelog v1.1 ===\n\n` +
        `- Video zu Rezept: Caption + Untertitel + Audio-Transkription\n` +
        `- Echte Nährwerte aus USDA FoodData + OpenFoodFacts\n` +
        `- Makros pro Portion & 100g, Mikronährstoffe, Allergene\n` +
        `- Editierbare Portionen & Zutatenliste\n` +
        `- Kochbuch-System mit Kategorien & 2x2 Bildcollage\n` +
        `- Sterne-Bewertung, Video-Thumbnail als Bild\n` +
        `- US → metrisch Umrechnung\n` +
        `- Export/Import/Teilen inkl. aller API Keys\n\n` +
        `Import: Einstellungen > Passwort (2026) > Importieren`,
      attachments: [{
        filename: fileName,
        content: JSON.stringify(syncData, null, 2),
        contentType: "application/json",
      }],
    });

    console.log("Sync email sent successfully");
    res.json({ success: true });
  } catch (err) {
    console.error("Email send failed:", err.message);
    res.status(500).json({ error: "E-Mail konnte nicht gesendet werden: " + err.message });
  }
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Recipe API server running on http://localhost:${PORT}`);
});
