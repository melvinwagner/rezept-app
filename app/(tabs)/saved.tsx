import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
  FlatList,
  Image,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { getRecipes, deleteRecipe, getCookbooks, addCookbook, deleteCookbook, updateRecipe } from "../../services/storage";
import { Recipe } from "../../types/recipe";

const CARD_COLORS = [
  "#3A5A38", "#2E4A3E", "#4A6242", "#2A4A2A",
  "#3E5A4A", "#526B48", "#2A3E2E", "#4A5A3A",
  "#365A42", "#3A4A30",
];

const CARD_SUBTITLES: Record<string, string> = {
  "Meine Rezepte": "Alle Lieblingsrezepte",
  "Italienisch": "Pasta, Pizza & mehr",
  "Asiatisch": "Reis, Sushi & Co.",
  "Frühstück": "Für den perfekten Start",
  "Healthy": "Leicht & nährstoffreich",
  "Desserts": "Süße Verführung",
  "Schnelle Küche": "Unter 30 Minuten",
  "Vegetarisch": "Ohne Fleisch",
  "Grillen": "BBQ & Outdoor",
  "Meal Prep": "Für die Woche",
  "Backen": "Brot & Gebäck",
  "Fisch": "Lachs & mehr",
  "Pasta & Co.": "Nudelgerichte",
  "Test": "Zum Ausprobieren",
};

export default function SavedScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [cookbooks, setCookbooks] = useState<string[]>([]);
  const [selectedCookbook, setSelectedCookbook] = useState<string | null>(null);
  const [newCookbookName, setNewCookbookName] = useState("");
  const [showNewInput, setShowNewInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const [r, c] = await Promise.all([getRecipes(), getCookbooks()]);
    setRecipes(r);
    if (!c.includes("Meine Rezepte")) {
      c.unshift("Meine Rezepte");
      await addCookbook("Meine Rezepte");
    }
    setCookbooks(c);
  };

  const handleDelete = async (recipe: Recipe) => {
    const confirmed = Platform.OS === "web"
      ? window.confirm(`"${recipe.title}" wirklich löschen?`)
      : await new Promise((resolve) =>
          Alert.alert("Löschen?", `"${recipe.title}" wirklich löschen?`, [
            { text: "Abbrechen", onPress: () => resolve(false) },
            { text: "Löschen", style: "destructive", onPress: () => resolve(true) },
          ])
        );
    if (confirmed) {
      await deleteRecipe(recipe.id);
      loadData();
    }
  };

  const handleDeleteCookbook = async (name: string) => {
    if (name === "Meine Rezepte") return;
    const confirmed = Platform.OS === "web"
      ? window.confirm(`"${name}" löschen? Die Rezepte werden zu "Meine Rezepte" verschoben.`)
      : await new Promise((resolve) =>
          Alert.alert("Kategorie löschen?", `"${name}" löschen?`, [
            { text: "Abbrechen", onPress: () => resolve(false) },
            { text: "Löschen", style: "destructive", onPress: () => resolve(true) },
          ])
        );
    if (confirmed) {
      await deleteCookbook(name);
      setSelectedCookbook(null);
      loadData();
    }
  };

  const handleCreateCookbook = async () => {
    const name = newCookbookName.trim();
    if (!name) return;
    await addCookbook(name);
    setNewCookbookName("");
    setShowNewInput(false);
    loadData();
  };

  const handleRate = (recipe: Recipe, rating: number) => {
    const updated = { ...recipe, rating };
    updateRecipe(updated);
    setRecipes(recipes.map((r) => r.id === recipe.id ? updated : r));
  };

  const renderStars = (recipe: Recipe) => {
    const current = recipe.rating || 0;
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable key={star} onPress={() => handleRate(recipe, star)}>
            <Text style={[styles.star, star <= current && styles.starActive]}>
              {star <= current ? "★" : "☆"}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  };

  const getRecipesForCookbook = (name: string) => {
    return recipes.filter((r) => r.cookbook === name || (!r.cookbook && name === "Meine Rezepte"));
  };

  const getImagesForCookbook = (name: string): string[] => {
    return getRecipesForCookbook(name)
      .map((r) => r.imageUrl || r.thumbnail)
      .filter((img): img is string => !!img)
      .slice(0, 4);
  };

  // ============ REZEPT-LISTE ============
  if (selectedCookbook) {
    const categoryRecipes = getRecipesForCookbook(selectedCookbook);
    return (
      <View style={styles.container}>
        <View style={styles.detailHeader}>
          <Pressable onPress={() => setSelectedCookbook(null)} style={styles.backButton}>
            <Text style={styles.backText}>‹ Kochbuch</Text>
          </Pressable>
          <Text style={styles.detailTitle}>{selectedCookbook}</Text>
          <Text style={styles.detailCount}>{categoryRecipes.length} {categoryRecipes.length === 1 ? "Rezept" : "Rezepte"}</Text>
        </View>
        <FlatList
          data={categoryRecipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.recipeList}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Text style={styles.emptyListEmoji}>📖</Text>
              <Text style={styles.emptyListText}>Keine Rezepte in dieser Kategorie</Text>
            </View>
          }
          renderItem={({ item }) => {
            const img = item.imageUrl || item.thumbnail;
            return (
              <View style={styles.recipeCard}>
                <Pressable style={styles.recipeCardMain} onPress={() => router.push(`/recipe/${item.id}`)}>
                  {img && <Image source={{ uri: img }} style={styles.recipeThumb} />}
                  <View style={styles.recipeCardBody}>
                    <Text style={styles.recipeTitle}>{item.title}</Text>
                    <Text style={styles.recipeDesc} numberOfLines={1}>{item.description}</Text>
                    <View style={styles.recipeMeta}>
                      <Text style={styles.recipeMetaText}>{item.servings} Portionen</Text>
                      <Text style={styles.recipeMetaDot}>·</Text>
                      <Text style={styles.recipeMetaText}>{item.cookTime}</Text>
                      {item.nutritionPerServing?.kcal ? (
                        <><Text style={styles.recipeMetaDot}>·</Text><Text style={styles.recipeMetaText}>{item.nutritionPerServing.kcal} kcal</Text></>
                      ) : null}
                    </View>
                    {renderStars(item)}
                  </View>
                </Pressable>
                <View style={styles.actionRow}>
                  <Pressable style={styles.actionButton} onPress={() => router.push(`/recipe/${item.id}`)}>
                    <Text style={styles.actionIcon}>✎</Text>
                    <Text style={styles.actionLabel}>Bearbeiten</Text>
                  </Pressable>
                  <Pressable style={styles.actionButton} onPress={() => {
                    if (item.sourceUrl) {
                      if (Platform.OS === "web") {
                        window.open(item.sourceUrl, "_blank");
                      }
                    }
                  }}>
                    <Text style={styles.actionIcon}>▶</Text>
                    <Text style={styles.actionLabel}>Original</Text>
                  </Pressable>
                  <Pressable style={[styles.actionButton, styles.actionButtonDanger]} onPress={() => handleDelete(item)}>
                    <Text style={[styles.actionIcon, styles.actionIconDanger]}>✕</Text>
                    <Text style={[styles.actionLabel, styles.actionLabelDanger]}>Löschen</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      </View>
    );
  }

  // ============ KATEGORIEN-ÜBERSICHT ============
  const filteredCookbooks = searchQuery
    ? cookbooks.filter((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))
    : cookbooks;

  const renderCard = (name: string, index: number) => {
    const count = getRecipesForCookbook(name).length;
    const images = getImagesForCookbook(name);
    const color = CARD_COLORS[index % CARD_COLORS.length];
    const subtitle = CARD_SUBTITLES[name] || "";

    return (
      <View key={name} style={styles.cardWrapper}>
        <Pressable
          style={[styles.card, { backgroundColor: color }]}
          onPress={() => { setSelectedCookbook(name); setSearchQuery(""); }}
        >
          {/* 2x2 Bild-Collage oben */}
          <View style={styles.imageGrid}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.imageCell}>
                {images[i] ? (
                  <Image source={{ uri: images[i] }} style={styles.imageCellImg} />
                ) : (
                  <View style={styles.imageCellEmpty} />
                )}
              </View>
            ))}
          </View>

          {/* Info-Bereich unten */}
          <View style={styles.cardInfo}>
            <View style={styles.cardInfoText}>
              <Text style={styles.cardName} numberOfLines={1}>{name}</Text>
              <Text style={styles.cardCount}>{count} {count === 1 ? "Rezept" : "Rezepte"}</Text>
              {subtitle ? <Text style={styles.cardSub} numberOfLines={1}>{subtitle}</Text> : null}
            </View>
            <Pressable style={styles.menuBtn} onPress={() => handleDeleteCookbook(name)}>
              <Text style={styles.menuDots}>⋮</Text>
            </Pressable>
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Kochbücher suchen..."
            placeholderTextColor="#A8B8A2"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <Text style={styles.sectionLabel}>Meine Kochbücher</Text>
        <View style={styles.grid}>
          {filteredCookbooks.map((name, i) => renderCard(name, i))}
        </View>

        <Text style={styles.sectionLabel}>Weitere Kochbücher</Text>
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonText}>Kochbücher von Creatorn – bald verfügbar</Text>
        </View>

        <View style={styles.addSection}>
          {!showNewInput ? (
            <Pressable style={styles.addButton} onPress={() => setShowNewInput(true)}>
              <Text style={styles.addPlus}>+</Text>
              <Text style={styles.addText}>Neue Kategorie erstellen</Text>
            </Pressable>
          ) : (
            <View style={styles.newBar}>
              <TextInput
                style={styles.newInput}
                value={newCookbookName}
                onChangeText={setNewCookbookName}
                placeholder="z.B. Desserts, Asiatisch..."
                placeholderTextColor="#A8B8A2"
                autoFocus
                onSubmitEditing={handleCreateCookbook}
              />
              <Pressable style={styles.newBtn} onPress={handleCreateCookbook}>
                <Text style={styles.newBtnText}>Erstellen</Text>
              </Pressable>
              <Pressable style={styles.cancelBtn} onPress={() => { setShowNewInput(false); setNewCookbookName(""); }}>
                <Text style={styles.cancelBtnText}>✕</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF2EA" },
  scrollContent: { paddingBottom: 100 },

  // Suche
  searchBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  searchInput: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    borderWidth: 0.5,
    borderColor: "rgba(123, 170, 110, 0.15)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  } as any,

  sectionLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2A3825",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },

  // ===== GRID =====
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
  },
  cardWrapper: {
    width: "48%" as any,
    marginHorizontal: "1%" as any,
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
  },

  // 2x2 Bilder
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    height: 130,
  },
  imageCell: {
    width: "50%",
    height: "50%",
    padding: 1,
  },
  imageCellImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: 2,
  } as any,
  imageCellEmpty: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 2,
  },

  // Info unten auf Karte
  cardInfo: {
    flexDirection: "row",
    padding: 8,
    paddingTop: 6,
    alignItems: "flex-start",
  },
  cardInfoText: { flex: 1 },
  cardName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  cardCount: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  cardSub: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
  menuBtn: {
    padding: 2,
    paddingLeft: 6,
    cursor: "pointer" as any,
  },
  menuDots: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 18,
  },

  // Weitere
  comingSoon: {
    marginHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "rgba(123, 170, 110, 0.15)",
    borderStyle: "dashed",
  },
  comingSoonText: { fontSize: 13, color: "#A8B8A2" },

  // Neue Kategorie
  addSection: { paddingHorizontal: 16, paddingTop: 12 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 0.5,
    borderColor: "rgba(123, 170, 110, 0.15)",
    gap: 10,
    cursor: "pointer" as any,
  },
  addPlus: { fontSize: 20, color: "#7BAA6E", fontWeight: "bold" },
  addText: { fontSize: 14, color: "#6E8868" },
  newBar: { flexDirection: "row", gap: 8 },
  newInput: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    borderWidth: 0.5,
    borderColor: "rgba(123, 170, 110, 0.15)",
  },
  newBtn: {
    backgroundColor: "rgba(123, 170, 110, 0.88)",
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  newBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  cancelBtn: {
    backgroundColor: "rgba(123, 170, 110, 0.1)",
    borderRadius: 12,
    width: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtnText: { color: "#98AE92", fontWeight: "bold", fontSize: 14 },

  // ===== DETAIL =====
  detailHeader: {
    backgroundColor: "rgba(42, 56, 37, 0.55)",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
  } as any,
  backButton: { marginBottom: 8 },
  backText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  detailTitle: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  detailCount: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 },

  recipeList: { padding: 16 },
  recipeCard: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 18,
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.8)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  } as any,
  recipeCardMain: { flexDirection: "row", alignItems: "center" },
  recipeThumb: { width: 80, height: 90, resizeMode: "cover" } as any,
  recipeCardBody: { flex: 1, padding: 12 },
  recipeTitle: { fontSize: 15, fontWeight: "bold", color: "#2A3825", marginBottom: 3 },
  recipeDesc: { fontSize: 12, color: "#6E8868", marginBottom: 6, lineHeight: 17 },
  recipeMeta: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  recipeMetaText: { fontSize: 11, color: "#7BAA6E", fontWeight: "600" },
  recipeMetaDot: { marginHorizontal: 4, color: "#C2D0BC" },
  starsRow: { flexDirection: "row", gap: 2 },
  star: { fontSize: 16, color: "#D2DCC8" },
  starActive: { color: "#FFB300" },
  actionRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#E2EBD8" },
  actionButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, gap: 4, cursor: "pointer" as any },
  actionButtonDanger: {},
  actionIcon: { fontSize: 14, color: "#7BAA6E" },
  actionIconDanger: { color: "#9B4444" },
  actionLabel: { fontSize: 12, color: "#6E8868", fontWeight: "600" },
  actionLabelDanger: { color: "#9B4444" },
  emptyList: { alignItems: "center", paddingTop: 50 },
  emptyListEmoji: { fontSize: 48, marginBottom: 12 },
  emptyListText: { fontSize: 14, color: "#98AE92" },
});
