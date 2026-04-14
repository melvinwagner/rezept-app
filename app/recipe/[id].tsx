import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Share,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getRecipes } from "../../services/storage";
import { Recipe } from "../../types/recipe";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecipe();
  }, [id]);

  const loadRecipe = async () => {
    const recipes = await getRecipes();
    const found = recipes.find((r) => r.id === id);
    setRecipe(found || null);
    setLoading(false);
  };

  const handleShare = async () => {
    if (!recipe) return;
    const text = `${recipe.title}\n\nZutaten:\n${recipe.ingredients.map((i) => `• ${i}`).join("\n")}\n\nZubereitung:\n${recipe.steps.map((s, idx) => `${idx + 1}. ${s}`).join("\n")}`;
    await Share.share({ message: text });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Rezept nicht gefunden</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{recipe.title}</Text>
      <Text style={styles.description}>{recipe.description}</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Portionen</Text>
          <Text style={styles.metaValue}>{recipe.servings}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Vorbereitung</Text>
          <Text style={styles.metaValue}>{recipe.prepTime}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Kochzeit</Text>
          <Text style={styles.metaValue}>{recipe.cookTime}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Zutaten</Text>
      <View style={styles.ingredientsList}>
        {recipe.ingredients.map((item, i) => (
          <View key={i} style={styles.ingredientRow}>
            <View style={styles.bullet} />
            <Text style={styles.ingredientText}>{item}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Zubereitung</Text>
      {recipe.steps.map((step, i) => (
        <View key={i} style={styles.stepRow}>
          <View style={styles.stepNumberContainer}>
            <Text style={styles.stepNumber}>{i + 1}</Text>
          </View>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>Teilen</Text>
        </TouchableOpacity>
        {recipe.sourceUrl && (
          <TouchableOpacity
            style={styles.sourceButton}
            onPress={() => Linking.openURL(recipe.sourceUrl)}
          >
            <Text style={styles.sourceButtonText}>Original-Video</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F0" },
  content: { padding: 20, paddingBottom: 40 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF8F0",
  },
  errorText: { fontSize: 16, color: "#999" },
  title: { fontSize: 28, fontWeight: "bold", color: "#333", marginBottom: 8 },
  description: { fontSize: 15, color: "#666", lineHeight: 22, marginBottom: 20 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  metaItem: { alignItems: "center", flex: 1 },
  metaLabel: { fontSize: 11, color: "#999", marginBottom: 4 },
  metaValue: { fontSize: 15, fontWeight: "700", color: "#FF6B35" },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 14,
  },
  ingredientsList: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF6B35",
    marginRight: 12,
  },
  ingredientText: { fontSize: 15, color: "#444", flex: 1 },
  stepRow: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  stepNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  stepNumber: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  stepText: { flex: 1, fontSize: 15, color: "#444", lineHeight: 22 },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  shareButton: {
    flex: 1,
    backgroundColor: "#FF6B35",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  shareButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  sourceButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF6B35",
  },
  sourceButtonText: { color: "#FF6B35", fontWeight: "bold", fontSize: 15 },
});
