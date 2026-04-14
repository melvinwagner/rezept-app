import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { getRecipes, deleteRecipe } from "../../services/storage";
import { Recipe } from "../../types/recipe";

export default function SavedScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadRecipes();
    }, [])
  );

  const loadRecipes = async () => {
    const data = await getRecipes();
    setRecipes(data);
  };

  const handleDelete = (recipe: Recipe) => {
    Alert.alert("Löschen?", `"${recipe.title}" wirklich löschen?`, [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Löschen",
        style: "destructive",
        onPress: async () => {
          await deleteRecipe(recipe.id);
          loadRecipes();
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/recipe/${item.id}`)}
      onLongPress={() => handleDelete(item)}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.cardMeta}>
          <Text style={styles.metaText}>{item.servings}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{item.cookTime}</Text>
        </View>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  if (recipes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📖</Text>
        <Text style={styles.emptyTitle}>Noch keine Rezepte</Text>
        <Text style={styles.emptySubtitle}>
          Erstelle dein erstes Rezept aus einem Video-Link!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={recipes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
      <Text style={styles.hint}>Lange drücken zum Löschen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F0" },
  list: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: "bold", color: "#333", marginBottom: 4 },
  cardDesc: { fontSize: 13, color: "#777", marginBottom: 8, lineHeight: 18 },
  cardMeta: { flexDirection: "row", alignItems: "center" },
  metaText: { fontSize: 12, color: "#FF6B35", fontWeight: "600" },
  metaDot: { marginHorizontal: 6, color: "#ccc" },
  arrow: { fontSize: 24, color: "#ccc", marginLeft: 8 },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#FFF8F0",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "bold", color: "#333", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#999", textAlign: "center", lineHeight: 20 },
  hint: {
    textAlign: "center",
    color: "#bbb",
    fontSize: 12,
    paddingBottom: 12,
  },
});
