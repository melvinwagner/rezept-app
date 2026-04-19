// Tagesbedarf-Referenzwerte für Erwachsene (DACH/EU-Empfehlungen, gerundet).
// Alle Werte in der kleinsten Einheit (mg oder µg).
//
// Quelle: DGE / EFSA-Referenzwerte (Stand 2024).
// Bei Keys sind Groß-/Kleinschreibung und typische Schreibweisen abgedeckt.

type RDA = { value: number; unit: "mg" | "µg" | "g" };

const RDA_TABLE: Record<string, RDA> = {
  // Vitamine
  "vitamin a":   { value: 800,  unit: "µg" },
  "vitamin c":   { value: 110,  unit: "mg" },
  "vitamin d":   { value: 20,   unit: "µg" },
  "vitamin e":   { value: 14,   unit: "mg" },
  "vitamin k":   { value: 70,   unit: "µg" },
  "vitamin b1":  { value: 1.2,  unit: "mg" },
  "thiamin":     { value: 1.2,  unit: "mg" },
  "vitamin b2":  { value: 1.4,  unit: "mg" },
  "riboflavin":  { value: 1.4,  unit: "mg" },
  "vitamin b3":  { value: 15,   unit: "mg" },
  "niacin":      { value: 15,   unit: "mg" },
  "vitamin b5":  { value: 6,    unit: "mg" },
  "pantothen":   { value: 6,    unit: "mg" },
  "vitamin b6":  { value: 1.5,  unit: "mg" },
  "vitamin b7":  { value: 40,   unit: "µg" },
  "biotin":      { value: 40,   unit: "µg" },
  "vitamin b9":  { value: 300,  unit: "µg" },
  "folsäure":    { value: 300,  unit: "µg" },
  "folat":       { value: 300,  unit: "µg" },
  "vitamin b12": { value: 4,    unit: "µg" },

  // Mineralien
  "calcium":     { value: 1000, unit: "mg" },
  "kalzium":     { value: 1000, unit: "mg" },
  "eisen":       { value: 12,   unit: "mg" },
  "magnesium":   { value: 350,  unit: "mg" },
  "zink":        { value: 10,   unit: "mg" },
  "kalium":      { value: 4000, unit: "mg" },
  "natrium":     { value: 1500, unit: "mg" },
  "phosphor":    { value: 700,  unit: "mg" },
  "kupfer":      { value: 1.5,  unit: "mg" },
  "mangan":      { value: 2.5,  unit: "mg" },
  "selen":       { value: 70,   unit: "µg" },
  "jod":         { value: 200,  unit: "µg" },
  "chlorid":     { value: 2300, unit: "mg" },
  "chrom":       { value: 35,   unit: "µg" },
  "molybdän":    { value: 50,   unit: "µg" },
  "fluorid":     { value: 3.5,  unit: "mg" },
};

function normalize(nutrientName: string): string {
  return nutrientName.toLowerCase().replace(/[.\-_]/g, " ").replace(/\s+/g, " ").trim();
}

// Parse a value string like "3.2 mg", "420 mg", "1.1 µg", "70ug"
// Returns value in mg (or throws null if not parseable).
function parseToMg(valueStr: string): number | null {
  const s = valueStr.trim().toLowerCase().replace("μ", "µ");
  const match = s.match(/^([\d.,]+)\s*(mg|µg|ug|g)\s*$/);
  if (!match) return null;
  const num = parseFloat(match[1].replace(",", "."));
  if (Number.isNaN(num)) return null;
  const unit = match[2];
  if (unit === "mg") return num;
  if (unit === "µg" || unit === "ug") return num / 1000;
  if (unit === "g") return num * 1000;
  return null;
}

function rdaToMg(rda: RDA): number {
  if (rda.unit === "mg") return rda.value;
  if (rda.unit === "µg") return rda.value / 1000;
  if (rda.unit === "g") return rda.value * 1000;
  return rda.value;
}

/**
 * Calculate % daily-value for a given micronutrient.
 * Returns null if the nutrient name is unknown or value unparseable.
 */
export function percentDailyValue(name: string, value: string): number | null {
  const key = normalize(name);
  // try direct + prefix match
  const rda =
    RDA_TABLE[key] ??
    Object.entries(RDA_TABLE).find(([k]) => key.includes(k))?.[1];
  if (!rda) return null;

  const mg = parseToMg(value);
  if (mg === null) return null;

  const rdaMg = rdaToMg(rda);
  if (rdaMg <= 0) return null;

  return Math.round((mg / rdaMg) * 100);
}
