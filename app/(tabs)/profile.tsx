import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRecipes, getCookbooks } from "../../services/storage";

export default function ProfileScreen() {
  const [recipeCount, setRecipeCount] = useState(0);
  const [cookbookCount, setCookbookCount] = useState(0);
  const [userName, setUserName] = useState("Tester");
  const streak = 0;

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const r = await getRecipes();
        const c = await getCookbooks();
        const n = await AsyncStorage.getItem("user_name");
        setRecipeCount(r.length);
        setCookbookCount(c.length);
        if (n && n.trim()) setUserName(n.trim());
      })();
    }, [])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.book}>
        <LinearGradient
          colors={["#6B8B68", "#1E2E1A"]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.spine} />

        <View style={styles.brandRow}>
          <View style={styles.brandDash} />
          <Text style={styles.brand}>DAWG Kitchen</Text>
          <View style={styles.brandDash} />
        </View>

        <View style={styles.crest}>
          <Text style={styles.crestLetter}>P</Text>
        </View>

        <View style={styles.dividerTop} />

        <View style={styles.titleBlock}>
          <Text style={styles.title}>{userName}</Text>
          <Text style={styles.subtitle}>Ein Archiv in Bewegung</Text>
        </View>

        <View style={styles.dividerMid} />

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{recipeCount}</Text>
            <Text style={styles.statLabel}>Rezepte</Text>
          </View>
          <View style={styles.statSeparator} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{cookbookCount}</Text>
            <Text style={styles.statLabel}>Bücher</Text>
          </View>
          <View style={styles.statSeparator} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>

        <View style={styles.dividerBot} />

        <View style={styles.socials}>
          <Pressable style={[styles.social, styles.socialIG]}>
            <Text style={styles.socialText}>IG</Text>
          </Pressable>
          <Pressable style={[styles.social, styles.socialTT]}>
            <Text style={styles.socialText}>TT</Text>
          </Pressable>
          <Pressable style={[styles.social, styles.socialYT]}>
            <Text style={styles.socialText}>YT</Text>
          </Pressable>
          <Pressable style={[styles.social, styles.socialWeb]}>
            <Text style={styles.socialText}>↗</Text>
          </Pressable>
        </View>

        <Text style={styles.edition}>— Edition 2026 —</Text>
      </View>

      <View style={styles.settings}>
        <Pressable style={styles.settingsItem}>
          <Text style={styles.settingsIcon}>✎</Text>
          <Text style={styles.settingsText}>Profil bearbeiten</Text>
          <Text style={styles.settingsChevron}>›</Text>
        </Pressable>
        <View style={styles.settingsDivider} />
        <Pressable style={styles.settingsItem}>
          <Text style={styles.settingsIcon}>🌿</Text>
          <Text style={styles.settingsText}>Ernährungspräferenzen</Text>
          <Text style={styles.settingsChevron}>›</Text>
        </Pressable>
        <View style={styles.settingsDivider} />
        <Pressable style={styles.settingsItem}>
          <Text style={styles.settingsIcon}>🔗</Text>
          <Text style={styles.settingsText}>Socials verknüpfen</Text>
          <Text style={styles.settingsChevron}>›</Text>
        </Pressable>
        <View style={styles.settingsDivider} />
        <Pressable style={styles.settingsItem}>
          <Text style={styles.settingsIcon}>📤</Text>
          <Text style={styles.settingsText}>Karte teilen</Text>
          <Text style={styles.settingsChevron}>›</Text>
        </Pressable>
      </View>

      <Text style={styles.version}>DAWG · Vol. I · Ausgabe 2026</Text>
    </ScrollView>
  );
}

const GOLD = "#f4d88f";
const GOLD_SOFT = "rgba(244,216,143,0.6)";
const GOLD_SOFTER = "rgba(244,216,143,0.35)";
const GOLD_MUTED = "rgba(244,216,143,0.5)";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF2EA" },
  content: { padding: 20, paddingBottom: 110 },

  book: {
    width: "100%" as any,
    aspectRatio: 2 / 3,
    borderRadius: 6,
    overflow: "hidden" as any,
    position: "relative" as any,
    boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
    marginBottom: 20,
  } as any,
  spine: {
    position: "absolute" as any,
    left: 0, top: 0, bottom: 0,
    width: 4,
    backgroundColor: "rgba(0,0,0,0.25)",
    zIndex: 5,
  },

  brandRow: {
    position: "absolute" as any,
    top: 28,
    left: 0, right: 0,
    flexDirection: "row",
    alignItems: "center" as any,
    justifyContent: "center",
    gap: 8,
  },
  brandDash: { width: 14, height: 0.5, backgroundColor: GOLD_SOFTER },
  brand: {
    fontSize: 10,
    letterSpacing: 3,
    textTransform: "uppercase" as any,
    color: GOLD_SOFT,
    fontWeight: "700" as any,
  },

  crest: {
    position: "absolute" as any,
    top: "12%" as any,
    alignSelf: "center" as any,
    left: "50%" as any,
    marginLeft: -36,
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: GOLD_SOFT,
    alignItems: "center" as any,
    justifyContent: "center" as any,
  } as any,
  crestLetter: {
    fontSize: 30,
    fontWeight: "900" as any,
    color: GOLD,
  },

  dividerTop: {
    position: "absolute" as any,
    top: "27%" as any,
    left: "12%" as any,
    right: "12%" as any,
    height: 0.5,
    backgroundColor: GOLD_SOFTER,
  } as any,

  titleBlock: {
    position: "absolute" as any,
    top: "30%" as any,
    left: 20, right: 20,
    alignItems: "center" as any,
  } as any,
  title: {
    fontSize: 38,
    fontWeight: "900" as any,
    color: "#fff",
    textAlign: "center" as any,
    letterSpacing: -1.5,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 10,
    fontStyle: "italic" as any,
    letterSpacing: 2,
    color: GOLD_MUTED,
    marginTop: 14,
    textAlign: "center" as any,
  },

  dividerMid: {
    position: "absolute" as any,
    top: "59%" as any,
    left: "12%" as any,
    right: "12%" as any,
    height: 0.5,
    backgroundColor: GOLD_SOFTER,
  } as any,

  stats: {
    position: "absolute" as any,
    top: "62%" as any,
    left: 20, right: 20,
    flexDirection: "row",
    alignItems: "center" as any,
  } as any,
  stat: { flex: 1, alignItems: "center" as any },
  statValue: {
    fontSize: 24,
    fontWeight: "900" as any,
    color: "#fff",
  },
  statLabel: {
    fontSize: 8,
    textTransform: "uppercase" as any,
    letterSpacing: 1.5,
    color: GOLD_MUTED,
    marginTop: 3,
    fontWeight: "700" as any,
  },
  statSeparator: {
    width: 0.5,
    height: 32,
    backgroundColor: GOLD_SOFTER,
  },

  dividerBot: {
    position: "absolute" as any,
    top: "78%" as any,
    left: "12%" as any,
    right: "12%" as any,
    height: 0.5,
    backgroundColor: GOLD_SOFTER,
  } as any,

  socials: {
    position: "absolute" as any,
    top: "82%" as any,
    left: 0, right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  } as any,
  social: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center" as any,
    justifyContent: "center" as any,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.15)",
  },
  socialIG: {
    backgroundColor: "#dd2a7b",
  },
  socialTT: { backgroundColor: "#000" },
  socialYT: { backgroundColor: "#ff0000" },
  socialWeb: { backgroundColor: "#7BAA6E" },
  socialText: {
    color: "#fff",
    fontWeight: "800" as any,
    fontSize: 11,
    letterSpacing: -0.3,
  },

  edition: {
    position: "absolute" as any,
    bottom: 18,
    left: 0, right: 0,
    textAlign: "center" as any,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase" as any,
    color: "rgba(244,216,143,0.4)",
    fontWeight: "700" as any,
  } as any,

  settings: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 18,
    overflow: "hidden" as any,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.8)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  } as any,
  settingsItem: {
    flexDirection: "row",
    alignItems: "center" as any,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  settingsIcon: { fontSize: 15, color: "#5A9A4E", width: 20, textAlign: "center" as any },
  settingsText: { flex: 1, fontSize: 14, color: "#2A3825", fontWeight: "600" as any },
  settingsChevron: { fontSize: 18, color: "rgba(42,56,37,0.25)" },
  settingsDivider: { height: 0.5, backgroundColor: "rgba(42,56,37,0.06)", marginLeft: 48 },

  version: {
    textAlign: "center" as any,
    color: "#A8B8A2",
    fontSize: 11,
    marginTop: 20,
    letterSpacing: 1.5,
    textTransform: "uppercase" as any,
    fontWeight: "600" as any,
  },
});
