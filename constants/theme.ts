/**
 * DAWG Theme-Tokens — zentrale Farb- und Typo-Konstanten.
 *
 * Regel für den Signatur-Akzent (letztes Wort jeder Headline):
 *  - Auf Light/Cream-BG → `accentInk` (dunkel-sage, WCAG-AA konform)
 *  - Auf Dark/Forest-BG → `accentLuminous` (Pistazien, leuchtet auf dunkel)
 *
 * Pures `#fff` / `#000` ist im Design verboten. Nutze `paper` / `ink`.
 */

export const colors = {
  // Hintergründe
  bg: "#EEF2EA",                    // App-Cream-BG
  paper: "#FAFCF6",                 // "Papier-Weiß" getintet — ersetzt pure #fff in Inputs/Cards
  paperSoft: "rgba(255,255,255,0.85)",

  // Text / Ink
  ink: "#2A3825",                   // Primärer Text, Dark-Forest
  inkMuted: "#5E6E55",              // Sekundärer Text
  sageDim: "#8A9E82",               // Eyebrows, Labels
  sageFaint: "#A8B8A2",             // Tertiäre Hinweise, Footer-Text

  // Brand / Akzente
  green: "#5A9A4E",                 // Mid-Sage, für Dots, Links, kleinere Elemente
  greenLight: "#7AAA6E",            // Heller Sage, sekundärer Akzent
  accentInk: "#3F7A36",             // **Signatur auf Light-BG** — Contrast 4.3:1 auf cream → AA ok
  accentLuminous: "#B8D088",        // **Signatur auf Dark-BG** — Pistazien, Contrast 5.5:1 auf #2A3825

  // Cards
  card: "rgba(255,255,255,0.6)",
  cardStrong: "rgba(255,255,255,0.85)",
  cardBorder: "rgba(255,255,255,0.8)",
  cardBorderInk: "rgba(42,56,37,0.12)",
  cardShadow: "0 2px 12px rgba(0,0,0,0.04)",

  // Semantik
  error: "#B4472E",
  star: "#5A9A4E",                  // Gefüllter Stern
  starInactive: "rgba(42,56,37,0.12)",

  // Device
  deviceFrame: "#0A0D08",           // Device-Rahmen — sage-tinted Schwarz (statt pure #000)
};

/**
 * Cookbook-Cover-Paletten — Brand-konforme Gradient-Paare für Ausgaben/Sammlungen.
 * CARD_COLORS = Hauptkarten (Sage-Familie, alle grün-getönt)
 * PICKER_COLORS = Erweiterter Picker (erdige Töne für thematische Cookbooks)
 * Jedes Paar: [light, dark] für LinearGradient.
 */
export const palettes = {
  cookbookCards: [
    ["#6B8B68", "#1E2E1A"], // Waldgrün
    ["#8AAA7A", "#2A3E22"], // Salbei
    ["#A0B488", "#3A5230"], // Olive
    ["#7A9A8A", "#1E3428"], // Eukalyptus
    ["#8EAE7E", "#2A4220"], // Matcha
    ["#80A090", "#243828"], // Moos
    ["#9EAE8E", "#343E28"], // Thymian
    ["#7AAA8E", "#1A3424"], // Jade
    ["#96A87A", "#2A3618"], // Pistazie
    ["#84967A", "#1E2C16"], // Basilikum
  ] as ReadonlyArray<readonly [string, string]>,

  cookbookPickers: [
    ["#6B8B68", "#1E2E1A"], // Waldgrün
    ["#8AAA7A", "#2A3E22"], // Salbei
    ["#A09078", "#3A2818"], // Terrakotta
    ["#9A8A72", "#2E2418"], // Mokka
    ["#8890A0", "#282E3A"], // Schieferblau
    ["#A08A8A", "#382828"], // Rosewood
    ["#90987A", "#2A2E1A"], // Olive
    ["#7A8A98", "#1E2830"], // Ozean
    ["#A09A80", "#303018"], // Sand
    ["#9A8898", "#2E2430"], // Lavendel
    ["#88A090", "#1E3028"], // Jade
    ["#B09070", "#3A2010"], // Karamell
    ["#7898A8", "#1A2A38"], // Nordlicht
    ["#A8887A", "#302018"], // Zimt
  ] as ReadonlyArray<readonly [string, string]>,
};

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
};

/**
 * Font-Familien. In RN wird das Gewicht IM Familienamen mitgeliefert
 * (keine separate fontWeight-Prop nötig, das wirkt sonst inkonsistent).
 *
 * Display: Unbounded — modern geometric für Hero-Titel und Headers.
 * Body/UI: Manrope — geometrischer Sans, präzise, modern, nicht reflex.
 */
export const fonts = {
  // Display / Hero-Titel (Unbounded) — modern geometric
  displayMedium: "Unbounded_500Medium",
  displayBold: "Unbounded_700Bold",
  displayBlack: "Unbounded_800ExtraBold",

  // Header / Kategorie-Titel (Unbounded)
  headerBold: "Unbounded_700Bold",
  headerExtraBold: "Unbounded_800ExtraBold",

  // Eyebrows / All-Caps Labels (Syncopate) — architektonisch, viel spacing
  eyebrowCaps: "Syncopate_700Bold",

  // Body / UI (Manrope)
  bodyRegular: "Manrope_400Regular",
  bodyMedium: "Manrope_500Medium",
  bodySemi: "Manrope_600SemiBold",
  bodyBold: "Manrope_700Bold",
  bodyExtraBold: "Manrope_800ExtraBold",
};

/**
 * Typografie-Rollen als fertige Style-Objekte. Kein fontWeight-Prop — die
 * Gewichtung steckt in der fontFamily.
 */
export const typography = {
  // Display — Unbounded
  display:   { fontFamily: fonts.displayBlack,  fontSize: 32, letterSpacing: -0.8, lineHeight: 36 },
  hero:      { fontFamily: fonts.displayBlack,  fontSize: 28, letterSpacing: -0.6, lineHeight: 32 },
  h1:        { fontFamily: fonts.displayBold,   fontSize: 22, letterSpacing: -0.3, lineHeight: 27 },
  h2:        { fontFamily: fonts.displayBold,   fontSize: 18, letterSpacing: -0.2, lineHeight: 23 },
  serifBody: { fontFamily: fonts.displayMedium, fontSize: 15, letterSpacing: 0,    lineHeight: 22 },

  // UI / Body — Manrope
  body:      { fontFamily: fonts.bodyRegular, fontSize: 15, lineHeight: 22 },
  bodyStrong:{ fontFamily: fonts.bodySemi,    fontSize: 15, lineHeight: 22 },
  label:     { fontFamily: fonts.bodySemi,    fontSize: 13, lineHeight: 18 },
  small:     { fontFamily: fonts.bodyMedium,  fontSize: 12, lineHeight: 16 },
  caption:   { fontFamily: fonts.bodyMedium,  fontSize: 11, lineHeight: 14 },
  button:    { fontFamily: fonts.bodyBold,    fontSize: 15, letterSpacing: 0.2 },

  // Eyebrow / UPPERCASE labels (Syncopate Bold — architektonisch, editorial)
  eyebrow: {
    fontFamily: fonts.eyebrowCaps,
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: "uppercase" as const,
  },
  eyebrowSmall: {
    fontFamily: fonts.eyebrowCaps,
    fontSize: 9,
    letterSpacing: 2.8,
    textTransform: "uppercase" as const,
  },
};
