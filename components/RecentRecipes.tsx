import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { getRecipes } from "../services/storage";
import { Recipe } from "../types/recipe";
import { colors, fonts } from "../constants/theme";

/**
 * "Zuletzt gescannt" — horizontales Carousel am Ende des Start-Tabs.
 * Zeigt die letzten 6 erstellten Rezepte als kleine Thumbnails mit Titel + relativer Zeit.
 * Unaufdringlich (kleine Cards, dezenter Eyebrow), aber auffindbar.
 */
export function RecentRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const all = await getRecipes();
        const sorted = [...all]
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 6);
        setRecipes(sorted);
      })();
    }, [])
  );

  if (recipes.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.eyebrowRow}>
        <View style={styles.line} />
        <Text style={styles.eyebrow}>— Zuletzt gescannt —</Text>
        <View style={styles.line} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {recipes.map((r) => (
          <Pressable
            key={r.id}
            style={styles.card}
            onPress={() => router.push(`/recipe/${r.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Rezept öffnen: ${r.title}`}
          >
            <View style={styles.thumbWrap}>
              {r.imageUrl || r.thumbnail ? (
                <Image
                  source={{ uri: (r.imageUrl || r.thumbnail) as string }}
                  style={styles.thumb}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.thumb, styles.thumbFallback]} />
              )}
            </View>
            <View style={styles.meta}>
              <Text style={styles.title} numberOfLines={2}>
                {r.title}
              </Text>
              <Text style={styles.when}>{relativeTime(r.createdAt)}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return "Gerade";
  const hours = Math.round(mins / 60);
  if (hours < 24) return "Heute";
  const days = Math.round(hours / 24);
  if (days === 1) return "Gestern";
  if (days < 7) return `vor ${days}d`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `vor ${weeks}w`;
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
  });
}

const CARD_W = 118;
const THUMB_H = 76;

const styles = StyleSheet.create({
  section: {
    marginTop: 18,
    marginBottom: 12,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(42,56,37,0.10)",
  },
  eyebrow: {
    fontFamily: fonts.eyebrowCaps,
    fontSize: 9,
    letterSpacing: 2.4,
    color: colors.sageDim,
    textTransform: "uppercase",
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    width: CARD_W,
    backgroundColor: colors.paper,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "rgba(42,56,37,0.10)",
    overflow: "hidden",
    marginRight: 10,
  },
  thumbWrap: {
    width: "100%",
    height: THUMB_H,
    backgroundColor: "rgba(42,56,37,0.06)",
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  thumbFallback: {
    backgroundColor: "rgba(42,56,37,0.08)",
  },
  meta: {
    padding: 10,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 11.5,
    lineHeight: 14,
    letterSpacing: -0.2,
    color: colors.ink,
    minHeight: 28,
  },
  when: {
    fontFamily: fonts.eyebrowCaps,
    fontSize: 7.5,
    letterSpacing: 1.4,
    color: colors.sageDim,
    textTransform: "uppercase",
    marginTop: 4,
  },
});
