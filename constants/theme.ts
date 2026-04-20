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
 * Display: Frank Ruhl Libre — editorial serif, warm-kuratiert, nicht reflex.
 * Body/UI: Manrope — geometrischer Sans, präzise, modern, nicht reflex.
 */
export const fonts = {
  // Display (Frank Ruhl Libre)
  displayBold: "FrankRuhlLibre_700Bold",
  displayBlack: "FrankRuhlLibre_900Black",
  displayMedium: "FrankRuhlLibre_500Medium",

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
  // Editorial Display — Frank Ruhl Libre
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

  // Eyebrow / UPPERCASE labels (Manrope ExtraBold mit letter-spacing)
  eyebrow: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase" as const,
  },
  eyebrowSmall: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
  },
};
