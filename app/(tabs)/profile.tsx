import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRecipes, getCookbooks } from "../../services/storage";
import { Cover, COVER_LAYOUTS, COVER_PALETTE, CoverLayoutId } from "../../components/Cover";

export default function ProfileScreen() {
  const [recipeCount, setRecipeCount] = useState(0);
  const [cookbookCount, setCookbookCount] = useState(0);
  const [userName, setUserName] = useState("Tester");
  const [colorIdx, setColorIdx] = useState(0);
  const [layoutId, setLayoutId] = useState<CoverLayoutId>("classic");
  const streak = 0;

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [r, c, entries] = await Promise.all([
          getRecipes(),
          getCookbooks(),
          AsyncStorage.multiGet([
            "user_name",
            "cover_color_idx",
            "cover_layout_id",
          ]),
        ]);
        setRecipeCount(r.length);
        setCookbookCount(c.length);

        for (const [k, v] of entries) {
          if (!v) continue;
          if (k === "user_name" && v.trim()) setUserName(v.trim());
          if (k === "cover_color_idx") {
            const i = parseInt(v, 10);
            if (!Number.isNaN(i) && i >= 0 && i < COVER_PALETTE.length) {
              setColorIdx(i);
            }
          }
          if (k === "cover_layout_id") {
            if (COVER_LAYOUTS.some((l) => l.id === v)) {
              setLayoutId(v as CoverLayoutId);
            }
          }
        }
      })();
    }, [])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <Cover
          layout={layoutId}
          gradient={COVER_PALETTE[colorIdx].grad}
          name={userName}
          handle="@du"
          stats={[
            { label: "Rezepte", value: recipeCount },
            { label: "Bücher", value: cookbookCount },
            { label: "Streak", value: streak },
          ]}
          width={280}
        />
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

      <Text style={styles.version}>DAWG · 1.0 Alpha · Ausgabe 2026</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF2EA" },
  content: { padding: 20, paddingBottom: 110 },

  settings: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 18,
    overflow: "hidden" as any,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.8)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
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
