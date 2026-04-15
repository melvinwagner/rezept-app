require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const app = express();
app.use(cors());
app.use(express.json());

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const USDA_API_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
const USDA_API_KEY = process.env.USDA_API_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "";
const OFF_SEARCH_URL = "https://world.openfoodfacts.org/api/v2/search";
const OFF_USER_AGENT = "RezeptApp/1.0 (melvin.wagner97@gmail.com)";

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

  // Alle Zutaten parallel abfragen
  const results = await Promise.all(
    ingredients.map(async (ing) => ({
      ing,
      nutrition: await lookupNutrition(ing),
    }))
  );

  for (const { ing, nutrition } of results) {
    if (!nutrition) {
      console.log(`  No nutrition data for: ${ing.name}`);
      continue;
    }

    const weightG = unitToGrams(ing.amount, ing.unit);
    const factor = weightG / 100;

    console.log(`  ${ing.name}: ${weightG}g, ${Math.round(nutrition.kcal * factor)} kcal (source: ${nutrition.source})`);

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

  // Pro Portion
  const perServing = {
    kcal: Math.round(totals.kcal / servings),
    protein: Math.round(totals.protein / servings),
    carbs: Math.round(totals.carbs / servings),
    fat: Math.round(totals.fat / servings),
    fiber: Math.round((totals.fiber / servings) * 10) / 10,
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
    const perS = data.total / servings;
    if (perS >= 1) {
      microPerServing[name] = `${Math.round(perS)} ${data.unit}`;
    } else if (perS > 0) {
      microPerServing[name] = `${perS.toFixed(1)} ${data.unit}`;
    }
  }

  console.log(`  Total: ${Math.round(totals.kcal)} kcal, ${perServing.kcal} kcal/Portion`);

  return { perServing, per100g, microPerServing };
}

async function searchFoodImage(recipeName) {
  if (!PEXELS_API_KEY) return null;
  try {
    const query = recipeName.replace(/[^\w\s]/g, "").trim();
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query + " food")}&per_page=1&orientation=portrait`;
    const response = await fetch(url, {
      headers: { Authorization: PEXELS_API_KEY },
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.photos && data.photos.length > 0) {
      return data.photos[0].src.medium; // 350x560 ca.
    }
    return null;
  } catch (err) {
    console.error("Pexels search failed:", err.message);
    return null;
  }
}

function getVideoThumbnail(videoUrl) {
  return new Promise((resolve) => {
    execFile(
      "yt-dlp",
      ["--skip-download", "--print", "%(thumbnail)s", videoUrl],
      { timeout: 15000 },
      (error, stdout) => {
        if (error) { resolve(null); return; }
        const url = stdout.trim();
        resolve(url && url !== "NA" ? url : null);
      }
    );
  });
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

app.post("/api/generate-recipe", async (req, res) => {
  const { videoUrl, apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: "API Key fehlt." });
  }
  if (!videoUrl) {
    return res.status(400).json({ error: "Video URL fehlt." });
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rezept-"));

  try {
    // Step 1: Get video caption + thumbnail in parallel
    console.log("Step 1: Getting video caption + thumbnail...");
    const [caption, thumbnail] = await Promise.all([
      getVideoCaption(videoUrl),
      getVideoThumbnail(videoUrl),
    ]);
    if (caption) {
      console.log("Got caption, length:", caption.length);
      console.log("Caption:", caption.substring(0, 300) + "...");
    } else {
      console.log("No caption available.");
    }
    if (thumbnail) console.log("Got thumbnail:", thumbnail);

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

EINHEITEN - WICHTIG:
- Alle Mengenangaben MÜSSEN in europäischen/metrischen Einheiten angegeben werden (g, kg, ml, l, EL, TL, Stück).
- Rechne amerikanische Einheiten automatisch um: 1 cup Flüssigkeit = 240ml, 1 cup Mehl = 130g, 1 cup Zucker = 200g, 1 cup Butter = 225g, 1 cup Käse gerieben = 100g, 1 oz = 28g, 1 lb = 450g, 1 tbsp = 1 EL, 1 tsp = 1 TL, 1 stick Butter = 115g.
- Runde die Ergebnisse auf schöne, praktische Zahlen (z.B. 236ml → 240ml, 227g → 225g, 113g → 115g, 28g → 30g).
- Temperaturen in °C (falls Fahrenheit: (F-32) × 5/9, gerundet auf 5er-Schritte).
- "servings" MUSS eine Zahl sein (z.B. 2, nicht "2 Portionen").
- Jede Zutat MUSS ein Objekt sein mit "amount" (Zahl oder null), "unit" (String oder null) und "name" (String). Zutaten ohne Mengenangabe (z.B. "Salz nach Geschmack") haben amount: null und unit: null.

Antworte AUSSCHLIESSLICH mit validem JSON im folgenden Format, ohne Markdown-Codeblöcke oder zusätzlichen Text:

{
  "title": "Rezeptname",
  "description": "Kurze Beschreibung des Gerichts",
  "servings": 2,
  "prepTime": "z.B. 5 Min",
  "cookTime": "z.B. 8 Min",
  "ingredients": [{"amount": 200, "unit": "g", "name": "Zutat 1", "search": "ingredient 1 english"}, {"amount": 3, "unit": "EL", "name": "Zutat 2", "search": "ingredient 2 english"}, {"amount": null, "unit": null, "name": "Salz nach Geschmack", "search": "salt"}],
  "steps": ["Schritt 1 detailliert", "Schritt 2 detailliert"],
  "allergens": ["Gluten", "Milch"]
}

HINWEIS zu Zutaten:
- Jede Zutat MUSS ein "search"-Feld enthalten: ein kurzer englischer Suchbegriff für die USDA-Nährwertdatenbank (z.B. "butter", "garlic raw", "olive oil", "heavy cream", "parmesan cheese", "spaghetti pasta", "shallot"). Nur das reine Lebensmittel, keine Zubereitungsart.

HINWEIS zu Allergenen:
- allergens: Liste ALLE enthaltenen Allergene auf (z.B. Gluten, Milch, Ei, Soja, Nüsse, Sellerie, Senf, Sesam, Lupine, Weichtiere, Krebstiere, Fisch, Erdnüsse, Schwefeldioxid).
- Prüfe jede Zutat sorgfältig auf bekannte Allergene.`;

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
    } catch (nutritionErr) {
      console.error("Nutrition calculation failed:", nutritionErr.message);
      recipe.nutritionPerServing = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
      recipe.nutritionPer100g = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
      recipe.micronutrients = {};
    }

    // Thumbnail vom Video = Bild vom fertigen Essen
    recipe.imageUrl = thumbnail || null;
    recipe.thumbnail = thumbnail || null;
    if (thumbnail) console.log("Step 5: Using video thumbnail as food image");

    res.json(recipe);
  } catch (err) {
    console.error("Error:", err.message);
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
    });
  } catch (err) {
    console.error("Recalculate error:", err.message);
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

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Recipe API server running on http://localhost:${PORT}`);
});
