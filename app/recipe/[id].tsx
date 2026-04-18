import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Linking,
  Share,
  Image,
  Pressable,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getRecipes, updateRecipe } from "../../services/storage";
import { recalculateNutrition } from "../../services/api";
import { Recipe, Ingredient, Macros } from "../../types/recipe";

const ADD_UNIT_OPTIONS = ["g", "ml"];

function UnitPicker({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {ADD_UNIT_OPTIONS.map((unit) => (
        <Pressable
          key={unit}
          style={{
            paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8,
            backgroundColor: value === unit ? "#7BAA6E" : "#E2EBD8",
          }}
          onPress={() => onChange(unit)}
        >
          <Text style={{ fontSize: 13, fontWeight: "bold", color: value === unit ? "#fff" : "#6E8868" }}>{unit}</Text>
        </Pressable>
      ))}
    </View>
  );
}

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
  const [editMode, setEditMode] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [newIngName, setNewIngName] = useState("");
  const [newIngAmount, setNewIngAmount] = useState("");
  const [newIngUnit, setNewIngUnit] = useState("");
  const [editError, setEditError] = useState("");

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

  const handleDeleteIngredient = (index: number) => {
    if (!recipe) return;
    const updated = [...recipe.ingredients];
    updated.splice(index, 1);
    setRecipe({ ...recipe, ingredients: updated });
  };

  const handleUpdateIngredient = (index: number, field: string, value: string) => {
    if (!recipe) return;
    const updated = [...recipe.ingredients];
    if (field === "amount") {
      updated[index] = { ...updated[index], amount: value ? parseFloat(value) || null : null };
    } else if (field === "unit") {
      updated[index] = { ...updated[index], unit: value || null };
    } else if (field === "name") {
      updated[index] = { ...updated[index], name: value };
    }
    setRecipe({ ...recipe, ingredients: updated });
  };

  const handleAddIngredient = () => {
    if (!recipe || !newIngName.trim()) return;
    const newIng: Ingredient = {
      amount: newIngAmount ? parseFloat(newIngAmount) : null,
      unit: newIngUnit || null,
      name: newIngName.trim(),
      search: newIngName.trim(),
    };
    setRecipe({ ...recipe, ingredients: [...recipe.ingredients, newIng] });
    setNewIngName("");
    setNewIngAmount("");
    setNewIngUnit("");
  };

  const handleSaveChanges = async () => {
    if (!recipe) return;
    setRecalculating(true);
    setEditError("");
    try {
      const result = await recalculateNutrition(recipe.ingredients, originalServings);
      const updated: Recipe = {
        ...recipe,
        nutritionPerServing: result.nutritionPerServing,
        nutritionPer100g: result.nutritionPer100g,
        micronutrients: result.micronutrients,
      };
      await updateRecipe(updated);
      setRecipe(updated);
      setEditMode(false);
    } catch {
      setEditError("Nährwerte konnten nicht neu berechnet werden.");
    } finally {
      setRecalculating(false);
    }
  };

  const handleShare = async () => {
    if (!recipe) return;
    const text = `${recipe.title} (${currentServings} Portionen)\n\nZutaten:\n${recipe.ingredients.map((i) => `• ${formatIngredient(i, scale)}`).join("\n")}\n\nZubereitung:\n${recipe.steps.map((s, idx) => `${idx + 1}. ${s}`).join("\n")}`;
    await Share.share({ message: text });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7BAA6E" />
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
          <Text style={styles.description}>{recipe.description}</Text>
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

      <View style={styles.ingredientsHeader}>
        <Text style={styles.sectionTitle}>Zutaten</Text>
        <TouchableOpacity onPress={() => setEditMode(!editMode)} style={styles.editIconBtn}>
          <Text style={styles.editIconText}>{editMode ? "✓" : "✎"}</Text>
        </TouchableOpacity>
      </View>
      {editMode ? (
        <View style={styles.ingredientsList}>
          {recipe.ingredients.map((ing, i) => (
            <View key={i} style={styles.editRow}>
              <TextInput
                style={styles.editAmount}
                value={ing.amount != null ? String(ing.amount) : ""}
                onChangeText={(v) => handleUpdateIngredient(i, "amount", v)}
                keyboardType="numeric"
                placeholder="-"
                placeholderTextColor="#C2D0BC"
              />
              <Text style={styles.editUnitLabel}>{ing.unit || ""}</Text>
              <Text style={styles.editNameLabel} numberOfLines={1}>{ing.name}</Text>
              <TouchableOpacity onPress={() => handleDeleteIngredient(i)} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.addSection}>
            <Text style={styles.addLabel}>Zutat hinzufügen</Text>
            <Text style={styles.addWarning}>Neue Zutaten können die Nährwerte verfälschen (Daten aus externer DB).</Text>
            <View style={styles.addRow}>
              <TextInput
                style={styles.editAmount}
                value={newIngAmount}
                onChangeText={setNewIngAmount}
                keyboardType="numeric"
                placeholder="100"
                placeholderTextColor="#C2D0BC"
              />
              <UnitPicker value={newIngUnit || null} onChange={(v) => setNewIngUnit(v || "")} />
              <TextInput
                style={styles.editName}
                value={newIngName}
                onChangeText={setNewIngName}
                placeholder="z.B. Shrimps"
                placeholderTextColor="#C2D0BC"
              />
              <TouchableOpacity onPress={handleAddIngredient} style={styles.addBtn}>
                <Text style={styles.addBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {editError ? (
            <View style={styles.editErrorBox}>
              <Text style={styles.editErrorText}>{editError}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.recalcBtn, recalculating && { opacity: 0.5 }]}
            onPress={handleSaveChanges}
            disabled={recalculating}
          >
            {recalculating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.recalcBtnText}>Speichern & Nährwerte neu berechnen</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.ingredientsList}>
          {recipe.ingredients.map((ing, i) => (
            <View key={i} style={styles.ingredientRow}>
              <View style={styles.bullet} />
              <Text style={styles.ingredientText}>{formatIngredient(ing, scale)}</Text>
            </View>
          ))}
        </View>
      )}

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

      {(recipe.tags && recipe.tags.length > 0) || recipe.notes ? (
        <View style={styles.extrasSection}>
          {recipe.tags && recipe.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {recipe.tags.map((t) => (
                <View key={t} style={styles.tagPill}>
                  <Text style={styles.tagPillText}>{t}</Text>
                </View>
              ))}
            </View>
          )}
          {recipe.notes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Notiz</Text>
              <Text style={styles.notesText}>{recipe.notes}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {recipe.nutritionPerServing && (
        <View style={styles.nutritionSection}>
          <Text style={styles.sectionTitle}>Nährwerte</Text>

          <Text style={styles.nutritionSubtitle}>Pro Portion</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}><Text style={styles.nutritionValue}>{recipe.nutritionPerServing.kcal}</Text><Text style={styles.nutritionLabel}>kcal</Text></View>
            <View style={styles.nutritionItem}><Text style={styles.nutritionValue}>{recipe.nutritionPerServing.protein}g</Text><Text style={styles.nutritionLabel}>Protein</Text></View>
            <View style={styles.nutritionItem}><Text style={styles.nutritionValue}>{recipe.nutritionPerServing.carbs}g</Text><Text style={styles.nutritionLabel}>Carbs</Text></View>
            <View style={styles.nutritionItem}><Text style={styles.nutritionValue}>{recipe.nutritionPerServing.fat}g</Text><Text style={styles.nutritionLabel}>Fett</Text></View>
            <View style={styles.nutritionItem}><Text style={styles.nutritionValue}>{recipe.nutritionPerServing.fiber}g</Text><Text style={styles.nutritionLabel}>Ballast.</Text></View>
          </View>

          <Text style={styles.nutritionSubtitle}>Pro 100g</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}><Text style={styles.nutritionValue}>{recipe.nutritionPer100g.kcal}</Text><Text style={styles.nutritionLabel}>kcal</Text></View>
            <View style={styles.nutritionItem}><Text style={styles.nutritionValue}>{recipe.nutritionPer100g.protein}g</Text><Text style={styles.nutritionLabel}>Protein</Text></View>
            <View style={styles.nutritionItem}><Text style={styles.nutritionValue}>{recipe.nutritionPer100g.carbs}g</Text><Text style={styles.nutritionLabel}>Carbs</Text></View>
            <View style={styles.nutritionItem}><Text style={styles.nutritionValue}>{recipe.nutritionPer100g.fat}g</Text><Text style={styles.nutritionLabel}>Fett</Text></View>
            <View style={styles.nutritionItem}><Text style={styles.nutritionValue}>{recipe.nutritionPer100g.fiber}g</Text><Text style={styles.nutritionLabel}>Ballast.</Text></View>
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

const G = "rgba(42, 56, 37, 0.55)";
const W = (a: number) => `rgba(255,255,255,${a})`;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF2EA" },
  content: { padding: 16, paddingBottom: 40 },

  recipeHeader: { flexDirection: "row", marginBottom: 20, gap: 16, alignItems: "flex-start" },
  recipeImageCol: { alignItems: "center" as any, flexShrink: 0 },
  recipeImage: { width: 120, height: 140, borderRadius: 18 },
  recipeHeaderText: { flex: 1, justifyContent: "flex-start" as any, paddingTop: 2 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#EEF2EA" },
  errorText: { fontSize: 16, color: "#98AE92" },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 10 },
  title: { fontSize: 21, fontWeight: "700", color: "#2A3825", lineHeight: 27, marginBottom: 5, letterSpacing: -0.3 },
  creatorBadge: {
    alignItems: "center", backgroundColor: G, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4, marginTop: 8, maxWidth: 120,
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.1)",
  },
  creatorPlatform: { fontSize: 9, fontWeight: "500", color: "rgba(255,255,255,0.5)", marginBottom: 1 },
  creatorSeparator: { fontSize: 9, color: "rgba(255,255,255,0.3)" },
  creatorHandle: { fontSize: 9, fontWeight: "600", color: "rgba(255,255,255,0.85)", flexShrink: 1 },
  description: { fontSize: 13, color: "#6E8868", lineHeight: 19, marginTop: 4 },

  metaRow: {
    flexDirection: "row", justifyContent: "space-between",
    backgroundColor: G, borderRadius: 18, padding: 14, marginBottom: 24,
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
  } as any,
  metaItem: { alignItems: "center", flex: 1, paddingHorizontal: 2 },
  metaLabel: { fontSize: 9, color: "rgba(255,255,255,0.45)", marginBottom: 3, textAlign: "center" as any, letterSpacing: 0.3 },
  metaValue: { fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.9)", textAlign: "center" as any },
  servingsRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  servingsButton: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  servingsButtonText: { color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: "600", lineHeight: 13, textAlign: "center" as any },
  servingsValue: { fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.9)", minWidth: 14, textAlign: "center" as any },

  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#2A3825", marginBottom: 14, letterSpacing: -0.2 },
  ingredientsList: {
    backgroundColor: W(0.55), borderRadius: 20, padding: 16, marginBottom: 24,
    borderWidth: 0.5, borderColor: W(0.75),
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
  } as any,
  ingredientRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#7BAA6E", marginRight: 12 },
  ingredientText: { fontSize: 14, color: "#2A3825", flex: 1 },

  stepRow: {
    flexDirection: "row", marginBottom: 10, alignItems: "flex-start",
    backgroundColor: W(0.35), borderRadius: 16, padding: 14,
    borderWidth: 0.5, borderColor: W(0.5),
  },
  stepNumberContainer: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: G, justifyContent: "center", alignItems: "center", marginRight: 14,
  },
  stepNumber: { color: "#fff", fontSize: 12, fontWeight: "600" },
  stepText: { flex: 1, fontSize: 14, color: "#2A3825", lineHeight: 21 },

  actions: { flexDirection: "row", gap: 10, marginTop: 24 },
  editButton: {
    flex: 1, backgroundColor: "#7BAA6E", borderRadius: 18, padding: 15, alignItems: "center",
    boxShadow: "0 4px 20px rgba(122,170,110,0.3)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.15)",
  } as any,
  editButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  shareButton: {
    flex: 1, backgroundColor: G, borderRadius: 18, padding: 15, alignItems: "center",
    boxShadow: "0 4px 20px rgba(42,56,37,0.18)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)",
  } as any,
  shareButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  extrasSection: { marginTop: 22 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  tagPill: {
    backgroundColor: "rgba(122,170,110,0.15)", borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 0.5, borderColor: "rgba(122,170,110,0.3)",
  },
  tagPillText: { fontSize: 12, fontWeight: "700", color: "#5A9A4E" },
  notesBox: {
    backgroundColor: W(0.55), borderRadius: 16, padding: 14,
    borderWidth: 0.5, borderColor: W(0.75),
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
  } as any,
  notesLabel: { fontSize: 11, fontWeight: "700", color: "#5A7A52", letterSpacing: 0.3, textTransform: "uppercase" as any, marginBottom: 6 },
  notesText: { fontSize: 14, color: "#2A3825", lineHeight: 20 },
  sourceButton: {
    flex: 1, backgroundColor: W(0.5), borderRadius: 18, padding: 15, alignItems: "center",
    borderWidth: 0.5, borderColor: W(0.7),
    backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
  } as any,
  sourceButtonText: { color: "#5A9A4E", fontWeight: "600", fontSize: 14 },

  nutritionSection: { marginTop: 24 },
  nutritionSubtitle: { fontSize: 12, fontWeight: "600", color: "#8A9E82", marginBottom: 8, marginTop: 12, letterSpacing: 0.3, textTransform: "uppercase" as any },
  nutritionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  nutritionItem: { backgroundColor: W(0.4), borderRadius: 14, paddingVertical: 10, paddingHorizontal: 6, alignItems: "center", minWidth: 58, flex: 1, borderWidth: 0.5, borderColor: W(0.6) },
  nutritionValue: { fontSize: 15, fontWeight: "700", color: "#5A9A4E" },
  nutritionLabel: { fontSize: 9, color: "#98AE92", marginTop: 2, textAlign: "center" as any },
  microButton: { backgroundColor: W(0.35), borderRadius: 14, padding: 12, alignItems: "center", marginTop: 16, borderWidth: 0.5, borderColor: W(0.5) },
  microButtonText: { fontSize: 13, fontWeight: "600", color: "#6E8868" },
  microGrid: { backgroundColor: W(0.35), borderRadius: 14, padding: 12, marginTop: 10, borderWidth: 0.5, borderColor: W(0.5) },
  microRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: "rgba(123,170,110,0.06)" },
  microName: { fontSize: 13, color: "#6E8868" },
  microValue: { fontSize: 13, fontWeight: "600", color: "#2A3825" },
  allergenSection: { marginTop: 20, marginBottom: 20 },
  allergenRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  allergenBadge: { backgroundColor: "rgba(155,68,68,0.06)", borderRadius: 10, paddingHorizontal: 11, paddingVertical: 5, borderWidth: 0.5, borderColor: "rgba(155,68,68,0.1)" },
  allergenText: { fontSize: 12, fontWeight: "600", color: "#9B4444" },

  ingredientsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  editIconBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: W(0.5),
    alignItems: "center", justifyContent: "center", marginBottom: 8,
    borderWidth: 0.5, borderColor: W(0.8),
  },
  editIconText: { fontSize: 16, color: "#5A9A4E" },
  editRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 6 },
  editAmount: {
    width: 52, backgroundColor: W(0.55), borderRadius: 10, padding: 8, fontSize: 13,
    borderWidth: 0.5, borderColor: W(0.7), textAlign: "center" as any,
  },
  editUnitLabel: { width: 30, fontSize: 13, color: "#98AE92", textAlign: "center" as any },
  editNameLabel: { flex: 1, fontSize: 13, color: "#2A3825" },
  editName: {
    flex: 1, backgroundColor: W(0.55), borderRadius: 10, padding: 8, fontSize: 13,
    borderWidth: 0.5, borderColor: W(0.7),
  },
  deleteBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: "rgba(155,68,68,0.08)",
    borderWidth: 0.5, borderColor: "rgba(155,68,68,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  deleteBtnText: { color: "#9B4444", fontWeight: "700", fontSize: 11 },
  addSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 0.5, borderTopColor: "rgba(123,170,110,0.15)" },
  addLabel: { fontSize: 13, fontWeight: "700", color: "#2A3825", marginBottom: 4 },
  addWarning: { fontSize: 10, color: "#9B4444", marginBottom: 10, lineHeight: 14 },
  addRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12, marginTop: 4 },
  addBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(122,170,110,0.1)",
    borderWidth: 0.5, borderColor: "rgba(122,170,110,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  addBtnText: { color: "#5A9A4E", fontWeight: "700", fontSize: 16, lineHeight: 18 },
  recalcBtn: {
    backgroundColor: G, borderRadius: 14, padding: 13, alignItems: "center",
    marginTop: 10, marginBottom: 4,
    boxShadow: "0 3px 12px rgba(42,56,37,0.18)",
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)",
  } as any,
  recalcBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  editErrorBox: {
    backgroundColor: "rgba(155,68,68,0.08)", borderRadius: 12, padding: 10, marginTop: 8,
    borderWidth: 0.5, borderColor: "rgba(155,68,68,0.15)",
  },
  editErrorText: { color: "#9B4444", fontSize: 12 },
});
