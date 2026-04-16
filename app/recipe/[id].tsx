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
  Image,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getRecipes } from "../../services/storage";
import { Recipe, Ingredient, Macros } from "../../types/recipe";

function formatIngredient(ing: Ingredient, scale: number): string {
  if (ing.amount != null) {
    let scaled = ing.amount * scale;
    if (scaled >= 100) scaled = Math.round(scaled / 5) * 5;
    else if (scaled >= 10) scaled = Math.round(scaled);
    else scaled = Math.round(scaled * 10) / 10;
    const amountStr = scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);
    return ing.unit ? `${amountStr} ${ing.unit} ${ing.name}` : `${amountStr} ${ing.name}`;
  }
  return ing.name;
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentServings, setCurrentServings] = useState(0);
  const [originalServings, setOriginalServings] = useState(0);
  const [showMicro, setShowMicro] = useState(false);

  useEffect(() => {
    loadRecipe();
  }, [id]);

  const loadRecipe = async () => {
    const recipes = await getRecipes();
    const found = recipes.find((r) => r.id === id);
    setRecipe(found || null);
    if (found) {
      setOriginalServings(found.servings);
      setCurrentServings(found.servings);
    }
    setLoading(false);
  };

  const scale = originalServings > 0 ? currentServings / originalServings : 1;

  const handleShare = async () => {
    if (!recipe) return;
    const text = `${recipe.title} (${currentServings} Portionen)\n\nZutaten:\n${recipe.ingredients.map((i) => `• ${formatIngredient(i, scale)}`).join("\n")}\n\nZubereitung:\n${recipe.steps.map((s, idx) => `${idx + 1}. ${s}`).join("\n")}`;
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
      <View style={styles.recipeHeader}>
        <View style={styles.recipeImageCol}>
          {recipe.imageUrl && (
            <Image
              source={{ uri: recipe.imageUrl }}
              style={styles.recipeImage}
              resizeMode="cover"
            />
          )}
          {recipe.creatorHandle && (
            <TouchableOpacity
              style={styles.creatorBadge}
              onPress={() => recipe.creatorUrl && Linking.openURL(recipe.creatorUrl)}
            >
              <Text style={styles.creatorPlatform}>{recipe.creatorPlatform}</Text>
              <Text style={styles.creatorSeparator}> | </Text>
              <Text style={styles.creatorHandle}>{recipe.creatorHandle}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.recipeHeaderText}>
          <Text style={styles.title}>{recipe.title}</Text>
          <Text style={styles.description} numberOfLines={3}>{recipe.description}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Portionen</Text>
          <View style={styles.servingsRow}>
            <TouchableOpacity
              style={styles.servingsButton}
              onPress={() => currentServings > 1 && setCurrentServings(currentServings - 1)}
            >
              <Text style={styles.servingsButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.servingsValue}>{currentServings}</Text>
            <TouchableOpacity
              style={styles.servingsButton}
              onPress={() => setCurrentServings(currentServings + 1)}
            >
              <Text style={styles.servingsButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>kcal / Portion</Text>
          <Text style={styles.metaValue}>{recipe.nutritionPerServing?.kcal ?? "-"}</Text>
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
        {recipe.ingredients.map((ing, i) => (
          <View key={i} style={styles.ingredientRow}>
            <View style={styles.bullet} />
            <Text style={styles.ingredientText}>{formatIngredient(ing, scale)}</Text>
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

      {recipe.nutritionPerServing && (
        <View style={styles.nutritionSection}>
          <Text style={styles.sectionTitle}>Nährwerte</Text>

          <Text style={styles.nutritionSubtitle}>Pro Portion</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}><Text style={styles.nutritionValue}>{recipe.nutritionPerServing.kcal}</Text><Text style={styles.nutritionLabel}>kcal</Text></View>
            <View style={styles.nutritionItem}><Text style={styles.nutritionValue}>{recipe.nutritionPerServing.protein}g</Text><Text style={styles.nutritionLabel}>Protein</Text></View>
            <View style={styles.nutritionItem}><Text style={styles.nutritionValue}>{recipe.nutritionPerServing.carbs}g</Text><Text style={styles.nutritionLabel}>Kohlenhydrate</Text></View>
            <View style={styles.nutritionItem}><Text style={styles.nutritionValue}>{recipe.nutritionPerServing.fat}g</Text><Text style={styles.nutritionLabel}>Fett</Text></View>
            <View style={styles.nutritionItem}><Text style={styles.nutritionValue}>{recipe.nutritionPerServing.fiber}g</Text><Text style={styles.nutritionLabel}>Ballaststoffe</Text></View>
          </View>

          <Text style={styles.nutritionSubtitle}>Pro 100g</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}><Text style={styles.nutritionValue}>{recipe.nutritionPer100g.kcal}</Text><Text style={styles.nutritionLabel}>kcal</Text></View>
            <View style={styles.nutritionItem}><Text style={styles.nutritionValue}>{recipe.nutritionPer100g.protein}g</Text><Text style={styles.nutritionLabel}>Protein</Text></View>
            <View style={styles.nutritionItem}><Text style={styles.nutritionValue}>{recipe.nutritionPer100g.carbs}g</Text><Text style={styles.nutritionLabel}>Kohlenhydrate</Text></View>
            <View style={styles.nutritionItem}><Text style={styles.nutritionValue}>{recipe.nutritionPer100g.fat}g</Text><Text style={styles.nutritionLabel}>Fett</Text></View>
            <View style={styles.nutritionItem}><Text style={styles.nutritionValue}>{recipe.nutritionPer100g.fiber}g</Text><Text style={styles.nutritionLabel}>Ballaststoffe</Text></View>
          </View>

          <TouchableOpacity
            style={styles.microButton}
            onPress={() => setShowMicro(!showMicro)}
          >
            <Text style={styles.microButtonText}>
              {showMicro ? "Mikronährstoffe ausblenden" : "Mikronährstoffe anzeigen"}
            </Text>
          </TouchableOpacity>

          {showMicro && recipe.micronutrients && (
            <View style={styles.microGrid}>
              {Object.entries(recipe.micronutrients).map(([name, value]) => (
                <View key={name} style={styles.microRow}>
                  <Text style={styles.microName}>{name}</Text>
                  <Text style={styles.microValue}>{value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {recipe.allergens && recipe.allergens.length > 0 && (
        <View style={styles.allergenSection}>
          <Text style={styles.sectionTitle}>Allergene</Text>
          <View style={styles.allergenRow}>
            {recipe.allergens.map((a, i) => (
              <View key={i} style={styles.allergenBadge}>
                <Text style={styles.allergenText}>{a}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F0" },
  content: { padding: 20, paddingBottom: 40 },
  recipeHeader: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 16,
  },
  recipeImageCol: {
    alignItems: "center" as any,
  },
  recipeImage: {
    width: 120,
    height: 140,
    borderRadius: 12,
  },
  recipeHeaderText: {
    flex: 1,
    justifyContent: "center" as any,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF8F0",
  },
  errorText: { fontSize: 16, color: "#999" },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 10,
  },
  title: { fontSize: 28, fontWeight: "bold", color: "#333" },
  creatorBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3EB",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 6,
  },
  creatorPlatform: { fontSize: 11, fontWeight: "600", color: "#999" },
  creatorSeparator: { fontSize: 11, color: "#ccc" },
  creatorHandle: { fontSize: 11, fontWeight: "700", color: "#FF6B35" },
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
  servingsRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  servingsButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
  },
  servingsButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold", lineHeight: 20 },
  servingsValue: { fontSize: 18, fontWeight: "bold", color: "#FF6B35", minWidth: 20, textAlign: "center" as any },
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
  nutritionSection: { marginTop: 24 },
  nutritionSubtitle: { fontSize: 14, fontWeight: "600", color: "#777", marginBottom: 8, marginTop: 12 },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  nutritionItem: {
    backgroundColor: "#FFF3EB",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    minWidth: 80,
    flex: 1,
  },
  nutritionValue: { fontSize: 16, fontWeight: "bold", color: "#FF6B35" },
  nutritionLabel: { fontSize: 10, color: "#999", marginTop: 2 },
  microButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 16,
  },
  microButtonText: { fontSize: 14, fontWeight: "600", color: "#666" },
  microGrid: {
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  microRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  microName: { fontSize: 14, color: "#555" },
  microValue: { fontSize: 14, fontWeight: "600", color: "#333" },
  allergenSection: { marginTop: 20, marginBottom: 20 },
  allergenRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  allergenBadge: {
    backgroundColor: "#FDECEA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#F5C6CB",
  },
  allergenText: { fontSize: 13, fontWeight: "600", color: "#B71C1C" },
});
