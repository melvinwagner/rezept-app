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
import CoverEditorModal from "../../components/CoverEditorModal";

export default function ProfileScreen() {
  const [recipeCount, setRecipeCount] = useState(0);
  const [cookbookCount, setCookbookCount] = useState(0);
  const [userName, setUserName] = useState("Tester");
  const [colorIdx, setColorIdx] = useState(0);
  const [layoutId, setLayoutId] = useState<CoverLayoutId>("classic");
  const [tagline, setTagline] = useState("Ein Archiv in Bewegung");
  const [edition, setEdition] = useState("Edition 2026");
  const [showEditor, setShowEditor] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const streak = 0;

  const loadAll = useCallback(async () => {
    const [r, c, entries] = await Promise.all([
      getRecipes(),
      getCookbooks(),
      AsyncStorage.multiGet([
        "user_name",
        "cover_color_idx",
        "cover_layout_id",
        "cover_tagline",
        "cover_edition",
        "editor_tip_seen",
      ]),
    ]);
    setRecipeCount(r.length);
    setCookbookCount(c.length);

    let tipSeen = false;
    for (const [k, v] of entries) {
      if (!v) continue;
      if (k === "user_name" && v.trim()) setUserName(v.trim());
      if (k === "cover_color_idx") {
        const i = parseInt(v, 10);
        if (!Number.isNaN(i) && i >= 0 && i < COVER_PALETTE.length) {
          setColorIdx(i);
        }
      }
      if (k === "cover_layout_id" && COVER_LAYOUTS.some((l) => l.id === v)) {
        setLayoutId(v as CoverLayoutId);
      }
      if (k === "cover_tagline") setTagline(v);
      if (k === "cover_edition") setEdition(v);
      if (k === "editor_tip_seen" && v === "true") tipSeen = true;
    }
    setShowTip(!tipSeen);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const dismissTip = async () => {
    await AsyncStorage.setItem("editor_tip_seen", "true");
    setShowTip(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {showTip && (
        <View style={styles.tipBanner}>
          <Text style={styles.tipText}>
            Gib deinem Cover den letzten Schliff — lass deiner Kreativität freien Lauf.
          </Text>
          <Pressable onPress={dismissTip} hitSlop={8}>
            <Text style={styles.tipClose}>✕</Text>
          </Pressable>
        </View>
      )}

      <View style={{ alignItems: "center", marginBottom: 20, marginTop: showTip ? 4 : 0 }}>
        <Cover
          layout={layoutId}
          gradient={COVER_PALETTE[colorIdx].grad}
          name={userName}
          tagline={tagline}
          edition={edition}
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
        <Pressable style={styles.settingsItem} onPress={() => setShowEditor(true)}>
          <Text style={styles.settingsNum}>01</Text>
          <Text style={styles.settingsText}>Profil bearbeiten</Text>
          <Text style={styles.settingsChevron}>›</Text>
        </Pressable>
        <View style={styles.settingsDivider} />
        <Pressable style={styles.settingsItem}>
          <Text style={styles.settingsNum}>02</Text>
          <Text style={styles.settingsText}>Ernährungspräferenzen</Text>
          <Text style={styles.settingsChevron}>›</Text>
        </Pressable>
        <View style={styles.settingsDivider} />
        <Pressable style={styles.settingsItem}>
          <Text style={styles.settingsNum}>03</Text>
          <Text style={styles.settingsText}>Socials verknüpfen</Text>
          <Text style={styles.settingsChevron}>›</Text>
        </Pressable>
        <View style={styles.settingsDivider} />
        <Pressable style={styles.settingsItem}>
          <Text style={styles.settingsNum}>04</Text>
          <Text style={styles.settingsText}>Karte teilen</Text>
          <Text style={styles.settingsChevron}>›</Text>
        </Pressable>
      </View>

      <Text style={styles.version}>DAWG · 1.1 Alpha · Ausgabe 2026</Text>

      <CoverEditorModal
        visible={showEditor}
        onClose={() => setShowEditor(false)}
        onSaved={() => {
          loadAll();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF2EA" },
  content: { padding: 20, paddingBottom: 110 },

  tipBanner: {
    backgroundColor: "rgba(122,170,110,0.15)",
    borderWidth: 0.5,
    borderColor: "rgba(90,154,78,0.35)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center" as any,
    gap: 10,
    marginBottom: 14,
  } as any,
  tipText: {
    flex: 1,
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    color: "#2A4220",
    lineHeight: 17,
  },
  tipClose: { fontFamily: "Manrope_700Bold", fontSize: 16, color: "#5A9A4E", paddingHorizontal: 4 },

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
  settingsNum: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 11,
    color: "#A8B8A2",
    width: 22,
    letterSpacing: 0.5,
    textAlign: "center" as any,
  },
  settingsText: { flex: 1, fontFamily: "Manrope_600SemiBold", fontSize: 14, color: "#2A3825", letterSpacing: -0.1 },
  settingsChevron: { fontSize: 18, color: "rgba(42,56,37,0.25)" },
  settingsDivider: { height: 0.5, backgroundColor: "rgba(42,56,37,0.06)", marginLeft: 48 },

  version: {
    fontFamily: "Manrope_700Bold",
    textAlign: "center" as any,
    color: "#A8B8A2",
    fontSize: 10,
    marginTop: 20,
    letterSpacing: 2,
    textTransform: "uppercase" as any,
  },
});
