import { Text, TextStyle, StyleProp } from "react-native";
import { colors } from "../constants/theme";

/**
 * DAWG-Signatur: Letztes Wort (oder mehrere, per `words`-Prop) einer Headline
 * wird automatisch im Akzent-Ton gerendert.
 *
 * Auto-Kontrast:
 *  - `onDark` (Default false) → Pistazien `#B8D088` (leuchtet auf Dark-Forest)
 *  - `onDark={false}` → Deep-Sage `#3F7A36` (WCAG-AA auf Cream)
 *
 * Beispiel:
 *  <AccentText style={styles.display}>Jedes Video wird zum Rezept.</AccentText>
 *  → "Rezept." in Akzent-Farbe
 *
 *  <AccentText words={2} style={styles.display}>Jedes Video wird zum Rezept</AccentText>
 *  → "zum Rezept" in Akzent-Farbe
 *
 *  <AccentText onDark style={styles.display}>…</AccentText>
 *  → Pistazien-Farbe (Dark-BG Modus)
 */
export function AccentText({
  children,
  words = 1,
  onDark = false,
  style,
  accentStyle,
}: {
  children: string;
  words?: number;
  onDark?: boolean;
  style?: StyleProp<TextStyle>;
  accentStyle?: StyleProp<TextStyle>;
}) {
  const accentColor = onDark ? colors.accentLuminous : colors.accentInk;

  const parts = children.trim().split(/\s+/);
  const head = parts.slice(0, Math.max(parts.length - words, 0)).join(" ");
  const tail = parts.slice(-words).join(" ");

  return (
    <Text style={style}>
      {head}
      {head ? " " : ""}
      <Text style={[{ color: accentColor }, accentStyle]}>{tail}</Text>
    </Text>
  );
}
