// Täglich rotierender Content — 10 Einträge pro Kategorie.
// Später durch Server-JSON ersetzbar (content-GET-Endpoint).
//
// Rotation: dayIndex = floor(Date.now() / 86400000) % 10
// Jeden Tag wird je 1 Eintrag aus jeder Kategorie ausgewählt.

export type GemueseEntry = {
  name: string;
  text: string;
  img: any; // require() resolves at bundle time
};

export type TippEntry = {
  emoji: string;
  label: string;
  text: string;
};

export type WusstestEntry = {
  emoji: string;
  label: string;
  text: string;
};

export type FactEntry = {
  emoji: string;
  label: string;
  number: string;
  text: string;
};

// ─────────────────────────────────────────
// 10 GEMÜSE DES TAGES
// ─────────────────────────────────────────
export const GEMUESE: GemueseEntry[] = [
  {
    name: "Tomate",
    text: "Tomaten enthalten Lycopin — ein Antioxidans, das beim Erhitzen sogar stärker wird.",
    img: require("../assets/gemuese/tomate.jpg"),
  },
  {
    name: "Brokkoli",
    text: "Hat mehr Vitamin C als Orangen und gilt als echtes Superfood fürs Immunsystem.",
    img: require("../assets/gemuese/brokkoli.jpg"),
  },
  {
    name: "Paprika",
    text: "Rote Paprika enthält doppelt so viel Vitamin C wie grüne — sie ist einfach die reifere Version.",
    img: require("../assets/gemuese/paprika.jpg"),
  },
  {
    name: "Avocado",
    text: "Reift erst nach der Ernte. Neben eine Banane legen beschleunigt den Prozess.",
    img: require("../assets/gemuese/avocado.jpg"),
  },
  {
    name: "Knoblauch",
    text: "Eine Zehe am Tag kann den Blutdruck um bis zu 10% senken.",
    img: require("../assets/gemuese/knoblauch.jpg"),
  },
  {
    name: "Spinat",
    text: "Verliert beim Kochen 90% seines Volumens. 500g roh werden zu einer kleinen Portion.",
    img: require("../assets/gemuese/spinat.jpg"),
  },
  {
    name: "Süßkartoffel",
    text: "Hat einen niedrigeren glykämischen Index als normale Kartoffeln — trotz süßem Geschmack.",
    img: require("../assets/gemuese/suesskartoffel.jpg"),
  },
  {
    name: "Kürbis",
    text: "Kürbiskerne enthalten mehr Eisen als Rindfleisch — ein unterschätzter Nährstoff-Booster.",
    img: require("../assets/gemuese/kuerbis.jpg"),
  },
  {
    name: "Zwiebel",
    text: "Zwiebeln im Kühlschrank schneiden reduziert das Weinen — Kälte verlangsamt den Reizstoff.",
    img: require("../assets/gemuese/zwiebel.jpg"),
  },
  {
    name: "Aubergine",
    text: "Saugt Öl auf wie ein Schwamm. Tipp: vorher salzen und 20 Min warten — nimmt weniger Fett auf.",
    img: require("../assets/gemuese/aubergine.jpg"),
  },
];

// ─────────────────────────────────────────
// 10 TIPPS DES TAGES
// ─────────────────────────────────────────
export const TIPPS: TippEntry[] = [
  {
    emoji: "🧄",
    label: "Tipp des Tages",
    text: "Knoblauch erst 10 Min. nach dem Schneiden erhitzen — so bildet sich das gesunde Allicin.",
  },
  {
    emoji: "🫒",
    label: "Tipp des Tages",
    text: "Olivenöl nicht stark erhitzen — die Antioxidantien verschwinden. Zum Braten lieber Rapsöl nehmen.",
  },
  {
    emoji: "🍚",
    label: "Tipp des Tages",
    text: "Reis nach dem Kochen abkühlen lassen senkt den glykämischen Index um bis zu 50%.",
  },
  {
    emoji: "🍌",
    label: "Tipp des Tages",
    text: "Reife Bananen mit braunen Flecken sind süßer — perfekt für Bananenbrot ohne extra Zucker.",
  },
  {
    emoji: "🧅",
    label: "Tipp des Tages",
    text: "Zwiebeln im Kühlschrank schneiden spart Tränen. Kälte verlangsamt den tränenreizenden Stoff.",
  },
  {
    emoji: "🧂",
    label: "Tipp des Tages",
    text: "Fleisch eine Stunde vor dem Braten salzen — das Salz zieht ein und macht jedes Steak saftiger.",
  },
  {
    emoji: "🍗",
    label: "Tipp des Tages",
    text: "Hähnchenhaut vor dem Braten trocken tupfen — so wird sie knusprig statt weich.",
  },
  {
    emoji: "🍝",
    label: "Tipp des Tages",
    text: "Pasta-Wasser so salzig wie Meerwasser. Ohne Salz schmeckt die Nudel auch mit der besten Sauce fad.",
  },
  {
    emoji: "🍅",
    label: "Tipp des Tages",
    text: "Tomaten nie in den Kühlschrank — sie verlieren dort ihr Aroma komplett.",
  },
  {
    emoji: "🌿",
    label: "Tipp des Tages",
    text: "Frische Kräuter erst am Ende dazugeben. Hitze zerstört die ätherischen Öle.",
  },
];

// ─────────────────────────────────────────
// 10 WUSSTEST DU SCHON
// ─────────────────────────────────────────
export const WUSSTEST: WusstestEntry[] = [
  {
    emoji: "✨",
    label: "Wusstest du?",
    text: "Zimt kann den Blutzuckerspiegel um bis zu 29% senken. Perfekt im Porridge oder Bananenbrot.",
  },
  {
    emoji: "❓",
    label: "Wusstest du?",
    text: "Ein Ei enthält alle essentiellen Aminosäuren und gilt als Referenz-Protein in der Ernährungswissenschaft.",
  },
  {
    emoji: "🍯",
    label: "Wusstest du?",
    text: "Honig verdirbt nie. In ägyptischen Gräbern wurden über 3.000 Jahre alte, noch essbare Gläser gefunden.",
  },
  {
    emoji: "🥑",
    label: "Wusstest du?",
    text: "Avocados sind Beeren. Erdbeeren dagegen nicht — sie sind Scheinfrüchte.",
  },
  {
    emoji: "🍫",
    label: "Wusstest du?",
    text: "Dunkle Schokolade enthält Theobromin — ein naher Verwandter des Koffeins, nur milder.",
  },
  {
    emoji: "🌰",
    label: "Wusstest du?",
    text: "Cashews wachsen an der Außenseite einer Frucht, nicht innen — wie kein anderer Nussbaum.",
  },
  {
    emoji: "🥛",
    label: "Wusstest du?",
    text: "Vollmilch hat nur 3,5% Fett. Bei 200ml sind das 7g — weniger als ein Esslöffel Öl.",
  },
  {
    emoji: "🫛",
    label: "Wusstest du?",
    text: "Grüne Erbsen haben mehr Eiweiß pro Gramm als Rindfleisch — allerdings weniger Eisen.",
  },
  {
    emoji: "☕",
    label: "Wusstest du?",
    text: "Kaffeesatz ist ein natürliches Peeling — und überdeckt Knoblauchgeruch an den Händen.",
  },
  {
    emoji: "🌶️",
    label: "Wusstest du?",
    text: "Capsaicin (die Schärfe in Chili) bindet an Schmerzrezeptoren — deshalb fühlt es sich heiß an, obwohl es kalt ist.",
  },
];

// ─────────────────────────────────────────
// 10 FOOD FACTS
// ─────────────────────────────────────────
export const FACTS: FactEntry[] = [
  {
    emoji: "📊",
    label: "Food Fact",
    number: "73%",
    text: "der Deutschen kochen mindestens 3x pro Woche selbst.",
  },
  {
    emoji: "📊",
    label: "Food Fact",
    number: "2.5 Mrd",
    text: "Rezeptvideos werden monatlich auf TikTok angesehen.",
  },
  {
    emoji: "📊",
    label: "Food Fact",
    number: "40%",
    text: "weniger Lebensmittel werden verschwendet, wenn man mit Einkaufsliste kocht.",
  },
  {
    emoji: "📊",
    label: "Food Fact",
    number: "8 Min",
    text: "dauert es durchschnittlich, ein Rezept von Hand abzutippen. DAWG macht es in Sekunden.",
  },
  {
    emoji: "📊",
    label: "Food Fact",
    number: "11 Mio t",
    text: "Lebensmittel wirft Deutschland pro Jahr weg — über die Hälfte davon in Privathaushalten.",
  },
  {
    emoji: "📊",
    label: "Food Fact",
    number: "2.5 h",
    text: "verbringt der durchschnittliche Deutsche pro Woche in der Küche — Tendenz steigend.",
  },
  {
    emoji: "📊",
    label: "Food Fact",
    number: "67%",
    text: "der Millennials kochen häufiger zu Hause als ihre Eltern im gleichen Alter.",
  },
  {
    emoji: "📊",
    label: "Food Fact",
    number: "12 h",
    text: "spart Meal-Prep pro Monat im Schnitt — Zeit, die sonst beim Einkaufen und Kochen liegt.",
  },
  {
    emoji: "📊",
    label: "Food Fact",
    number: "3x",
    text: "gesünder kochen Menschen zu Hause vs. im Restaurant — weniger Salz, Zucker und Fett.",
  },
  {
    emoji: "📊",
    label: "Food Fact",
    number: "52%",
    text: "der Deutschen sparen bewusst durch Meal-Planning — und essen trotzdem abwechslungsreicher.",
  },
];

// ─────────────────────────────────────────
// Rotation-Helper
// ─────────────────────────────────────────
function dayIndex(offset = 0, poolSize = 10): number {
  const days = Math.floor(Date.now() / 86400000);
  return (days + offset) % poolSize;
}

export function gemueseOfToday(): GemueseEntry {
  return GEMUESE[dayIndex(0, GEMUESE.length)];
}
export function tippOfToday(): TippEntry {
  return TIPPS[dayIndex(3, TIPPS.length)];
}
export function wusstestOfToday(): WusstestEntry {
  return WUSSTEST[dayIndex(6, WUSSTEST.length)];
}
export function factOfToday(): FactEntry {
  return FACTS[dayIndex(1, FACTS.length)];
}
