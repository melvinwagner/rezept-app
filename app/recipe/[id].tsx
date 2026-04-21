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
import { percentDailyValue } from "../../services/dailyValues";
import { Recipe, Ingredient, Macros } from "../../types/recipe";
import { AccentText } from "../../components/AccentText";
import { fonts } from "../../constants/theme";

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
          <Text style={{ fontSize: 13, fontFamily: fonts.bodyBold, color: value === unit ? "#fff" : "#6E8868" }}>{unit}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const NATIVE_UNITS = new Set(["g", "kg", "ml", "l"]);

function roundAmount(n: number): string {
  let v = n;
  if (v >= 100) v = Math.round(v / 5) * 5;
  else if (v >= 10) v = Math.round(v);
  else v = Math.round(v * 10) / 10;
  return v % 1 === 0 ? v.toString() : v.toFixed(1);
}

function formatIngredient(ing: Ingredient, scale: number): string {
  if (ing.amount == null) return ing.name;

  const amountStr = roundAmount(ing.amount * scale);
  const unitLower = (ing.unit || "").toLowerCase();
  const isNative = NATIVE_UNITS.has(unitLower);

  // Native Einheit (g, kg, ml, l) → klassisch
  if (isNative) return `${amountStr} ${ing.unit} ${ing.name}`;

  // Mit weight_g → Gramm vorne, Original dahinter
  if (typeof ing.weight_g === "number" && ing.weight_g > 0) {
    const grams = Math.round(ing.weight_g * scale);
    const tail = ing.unit ? `${amountStr} ${ing.unit}` : amountStr;
    return `${grams}g ${ing.name} · ${tail}`;
  }

  // Kein weight_g (Prise, Tropfen …) → klassisch
  return ing.unit ? `${amountStr} ${ing.unit} ${ing.name}` : `${amountStr} ${ing.name}`;
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

  // Zutatenmengen bleiben absolut — der Slider teilt das fixe Rezept auf N Portionen.
  const scale = 1;

  // Gesamt-kcal des Rezepts (Single Source of Truth).
  // Priorität: neues totalRecipe-Feld → sonst Summe ingredientNutrition → sonst perPortion × original.
  const totalRecipeKcal = (() => {
    if (recipe?.totalRecipe?.kcal != null && recipe.totalRecipe.kcal > 0) {
      return recipe.totalRecipe.kcal;
    }
    if (recipe?.ingredientNutrition && recipe.ingredientNutrition.length > 0) {
      return recipe.ingredientNutrition.reduce(
        (sum, n) => sum + (n.kcal ?? 0),
        0
      );
    }
    if (recipe?.nutritionPerServing?.kcal != null && originalServings > 0) {
      return recipe.nutritionPerServing.kcal * originalServings;
    }
    return 0;
  })();

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
    } else if (field === "weight_g") {
      updated[index] = { ...updated[index], weight_g: value ? parseFloat(value) || null : null };
    }
    setRecipe({ ...recipe, ingredients: updated });
  };

  const handleAddIngredient = () => {
    if (!recipe || !newIngName.trim()) return;
    const amountNum = newIngAmount ? parseFloat(newIngAmount) : null;
    const unitLower = newIngUnit.toLowerCase();
    // Bei nativen Einheiten: weight_g aus amount+unit ableiten; sonst null (User kann später editieren).
    let weight_g: number | null = null;
    if (amountNum != null) {
      if (unitLower === "g" || unitLower === "ml" || !unitLower) weight_g = amountNum;
      else if (unitLower === "kg" || unitLower === "l") weight_g = amountNum * 1000;
    }
    const newIng: Ingredient = {
      amount: amountNum,
      unit: newIngUnit || null,
      name: newIngName.trim(),
      search: newIngName.trim(),
      weight_g,
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
        ingredientNutrition: result.ingredientNutrition,
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
          <AccentText style={styles.title}>{recipe.title}</AccentText>
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
          <Text style={styles.metaValue}>
            {totalRecipeKcal > 0 && currentServings > 0
              ? Math.round(totalRecipeKcal / currentServings)
              : "-"}
          </Text>
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
          {recipe.ingredients.map((ing, i) => {
            const unitLower = (ing.unit || "").toLowerCase();
            const isNative = NATIVE_UNITS.has(unitLower);
            const hasWeight = typeof ing.weight_g === "number" && ing.weight_g > 0;
            // Bei Nicht-nativen Einheiten mit weight_g: Gramm editieren. Sonst: amount.
            const editGrams = !isNative && hasWeight;
            return (
              <View key={i} style={styles.editRow}>
                <TextInput
                  style={styles.editAmount}
                  value={
                    editGrams
                      ? (ing.weight_g != null ? String(ing.weight_g) : "")
                      : (ing.amount != null ? String(ing.amount) : "")
                  }
                  onChangeText={(v) =>
                    handleUpdateIngredient(i, editGrams ? "weight_g" : "amount", v)
                  }
                  keyboardType="numeric"
                  placeholder="-"
                  placeholderTextColor="#C2D0BC"
                />
                <Text style={styles.editUnitLabel}>
                  {editGrams ? "g" : (ing.unit || "")}
                </Text>
                <Text style={styles.editNameLabel} numberOfLines={1}>
                  {editGrams && ing.amount != null
                    ? `${ing.name} · ${ing.amount} ${ing.unit}`
                    : ing.name}
                </Text>
                <TouchableOpacity onPress={() => handleDeleteIngredient(i)} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            );
          })}

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
          {recipe.ingredients.map((ing, i) => {
            const nutrition = recipe.ingredientNutrition?.find(
              (n) => n.name === ing.name
            );
            const ingKcal =
              nutrition && nutrition.kcal != null
                ? Math.round(nutrition.kcal * scale)
                : null;
            return (
              <View key={i} style={styles.ingredientRow}>
                <View style={styles.bullet} />
                <View style={styles.ingredientTextWrap}>
                  <Text style={styles.ingredientText}>{formatIngredient(ing, scale)}</Text>
                  {ingKcal != null && (
                    <Text style={styles.ingredientKcal}>
                      {ingKcal} kcal
                      {nutrition?.source ? ` · ${nutrition.source}` : ""}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
          {totalRecipeKcal > 0 && (
            <View style={styles.ingredientTotalRow}>
              <Text style={styles.ingredientTotalLabel}>Gesamt · ÷ Portionen</Text>
              <Text style={styles.ingredientTotalValue}>
                {Math.round(totalRecipeKcal)} kcal ÷ {currentServings} ={" "}
                {currentServings > 0 ? Math.round(totalRecipeKcal / currentServings) : "-"} kcal/P
              </Text>
            </View>
          )}
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

      {(recipe.nutritionPerServing || recipe.totalRecipe) && (
        <View style={styles.nutritionSection}>
          <Text style={styles.sectionTitle}>Nährwerte</Text>

          <Text style={styles.nutritionSubtitle}>
            Pro Portion · {currentServings}{" "}
            {currentServings === 1 ? "Portion" : "Portionen"}
          </Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>
                {currentServings > 0 ? Math.round(totalRecipeKcal / currentServings) : "-"}
              </Text>
              <Text style={styles.nutritionLabel}>kcal</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>
                {recipe.totalRecipe && currentServings > 0
                  ? Math.round(recipe.totalRecipe.protein / currentServings)
                  : recipe.nutritionPerServing?.protein ?? 0}
                g
              </Text>
              <Text style={styles.nutritionLabel}>Protein</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>
                {recipe.totalRecipe && currentServings > 0
                  ? Math.round(recipe.totalRecipe.carbs / currentServings)
                  : recipe.nutritionPerServing?.carbs ?? 0}
                g
              </Text>
              <Text style={styles.nutritionLabel}>Carbs</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>
                {recipe.totalRecipe && currentServings > 0
                  ? Math.round(recipe.totalRecipe.fat / currentServings)
                  : recipe.nutritionPerServing?.fat ?? 0}
                g
              </Text>
              <Text style={styles.nutritionLabel}>Fett</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>
                {recipe.totalRecipe && currentServings > 0
                  ? (recipe.totalRecipe.fiber / currentServings).toFixed(1)
                  : recipe.nutritionPerServing?.fiber ?? 0}
                g
              </Text>
              <Text style={styles.nutritionLabel}>Ballast.</Text>
            </View>
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
              {Object.entries(recipe.micronutrients).map(([name, value]) => {
                const pct = percentDailyValue(name, value);
                return (
                  <View key={name} style={styles.microRow}>
                    <Text style={styles.microName}>{name}</Text>
                    <View style={styles.microValueBlock}>
                      <Text style={styles.microValue}>{value}</Text>
                      {pct !== null && (
                        <Text style={styles.microPct}>{pct}% RI</Text>
                      )}
                    </View>
                  </View>
                );
              })}
              <Text style={styles.microFootnote}>
                * Tagesbedarf laut RI (EU-Referenzwert, Erwachsene)
              </Text>
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
  title: {
    fontFamily: fonts.displayBlack,
    fontSize: 26, color: "#2A3825", lineHeight: 30, marginBottom: 6, letterSpacing: -0.5,
  },
  creatorBadge: {
    alignItems: "center", backgroundColor: G, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4, marginTop: 8, maxWidth: 120,
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.1)",
  },
  creatorPlatform: { fontSize: 9, fontFamily: fonts.bodyMedium, color: "rgba(255,255,255,0.5)", marginBottom: 1 },
  creatorSeparator: { fontSize: 9, color: "rgba(255,255,255,0.3)" },
  creatorHandle: { fontSize: 9, fontFamily: fonts.bodySemi, color: "rgba(255,255,255,0.85)", flexShrink: 1 },
  description: { fontSize: 13, color: "#6E8868", lineHeight: 19, marginTop: 4 },

  metaRow: {
    flexDirection: "row", justifyContent: "space-between",
    backgroundColor: G, borderRadius: 18, padding: 14, marginBottom: 24,
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
  } as any,
  metaItem: { alignItems: "center", flex: 1, paddingHorizontal: 2 },
  metaLabel: { fontSize: 9, color: "rgba(255,255,255,0.45)", marginBottom: 3, textAlign: "center" as any, letterSpacing: 0.3 },
  metaValue: { fontSize: 14, fontFamily: fonts.bodyBold, color: "rgba(255,255,255,0.9)", textAlign: "center" as any },
  servingsRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  servingsButton: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  servingsButtonText: { color: "rgba(255,255,255,0.9)", fontSize: 11, fontFamily: fonts.bodySemi, lineHeight: 13, textAlign: "center" as any },
  servingsValue: { fontSize: 14, fontFamily: fonts.bodyBold, color: "rgba(255,255,255,0.9)", minWidth: 14, textAlign: "center" as any },

  sectionTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 22, color: "#2A3825", marginBottom: 14, letterSpacing: -0.3,
  },
  ingredientsList: {
    backgroundColor: W(0.55), borderRadius: 20, padding: 16, marginBottom: 24,
    borderWidth: 0.5, borderColor: W(0.75),
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
  } as any,
  ingredientRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#7BAA6E", marginRight: 12, marginTop: 7 },
  ingredientTextWrap: { flex: 1 },
  ingredientText: { fontSize: 14, color: "#2A3825" },
  ingredientKcal: {
    fontFamily: fonts.eyebrowCaps,
    fontSize: 9,
    color: "#8A9E82",
    letterSpacing: 1.2,
    marginTop: 2,
    textTransform: "uppercase" as any,
  },
  ingredientTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center" as any,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(42,56,37,0.08)",
  },
  ingredientTotalLabel: {
    fontFamily: fonts.eyebrowCaps,
    fontSize: 9,
    color: "#5E6E55",
    letterSpacing: 1.4,
    textTransform: "uppercase" as any,
  },
  ingredientTotalValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: "#3F7A36",
  },

  stepRow: {
    flexDirection: "row", marginBottom: 10, alignItems: "flex-start",
    backgroundColor: W(0.35), borderRadius: 16, padding: 14,
    borderWidth: 0.5, borderColor: W(0.5),
  },
  stepNumberContainer: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: G, justifyContent: "center", alignItems: "center", marginRight: 14,
  },
  stepNumber: { color: "#fff", fontSize: 12, fontFamily: fonts.bodySemi },
  stepText: { flex: 1, fontSize: 14, color: "#2A3825", lineHeight: 21 },

  actions: { flexDirection: "row", gap: 10, marginTop: 24 },
  editButton: {
    flex: 1, backgroundColor: "#7BAA6E", borderRadius: 18, padding: 15, alignItems: "center",
    boxShadow: "0 4px 20px rgba(122,170,110,0.3)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.15)",
  } as any,
  editButtonText: { color: "#fff", fontFamily: fonts.bodyBold, fontSize: 14 },
  shareButton: {
    flex: 1, backgroundColor: G, borderRadius: 18, padding: 15, alignItems: "center",
    boxShadow: "0 4px 20px rgba(42,56,37,0.18)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)",
  } as any,
  shareButtonText: { color: "#fff", fontFamily: fonts.bodySemi, fontSize: 14 },
  extrasSection: { marginTop: 22 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  tagPill: {
    backgroundColor: "rgba(122,170,110,0.15)", borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 0.5, borderColor: "rgba(122,170,110,0.3)",
  },
  tagPillText: { fontSize: 12, fontFamily: fonts.bodyBold, color: "#5A9A4E" },
  notesBox: {
    backgroundColor: W(0.55), borderRadius: 16, padding: 14,
    borderWidth: 0.5, borderColor: W(0.75),
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
  } as any,
  notesLabel: { fontSize: 11, fontFamily: fonts.bodyBold, color: "#5A7A52", letterSpacing: 0.3, textTransform: "uppercase" as any, marginBottom: 6 },
  notesText: { fontSize: 14, color: "#2A3825", lineHeight: 20 },
  sourceButton: {
    flex: 1, backgroundColor: W(0.5), borderRadius: 18, padding: 15, alignItems: "center",
    borderWidth: 0.5, borderColor: W(0.7),
    backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
  } as any,
  sourceButtonText: { color: "#5A9A4E", fontFamily: fonts.bodySemi, fontSize: 14 },

  nutritionSection: { marginTop: 24 },
  nutritionSubtitle: { fontSize: 12, fontFamily: fonts.bodySemi, color: "#8A9E82", marginBottom: 8, marginTop: 12, letterSpacing: 0.3, textTransform: "uppercase" as any },
  nutritionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  nutritionItem: { backgroundColor: W(0.4), borderRadius: 14, paddingVertical: 10, paddingHorizontal: 6, alignItems: "center", minWidth: 58, flex: 1, borderWidth: 0.5, borderColor: W(0.6) },
  nutritionValue: { fontSize: 15, fontFamily: fonts.bodyBold, color: "#5A9A4E" },
  nutritionLabel: { fontSize: 9, color: "#98AE92", marginTop: 2, textAlign: "center" as any },
  microButton: { backgroundColor: W(0.35), borderRadius: 14, padding: 12, alignItems: "center", marginTop: 16, borderWidth: 0.5, borderColor: W(0.5) },
  microButtonText: { fontSize: 13, fontFamily: fonts.bodySemi, color: "#6E8868" },
  microGrid: { backgroundColor: W(0.35), borderRadius: 14, padding: 12, marginTop: 10, borderWidth: 0.5, borderColor: W(0.5) },
  microRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" as any, paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: "rgba(42,56,37,0.06)" } as any,
  microName: { fontSize: 13, color: "#6E8868" },
  microValueBlock: { alignItems: "flex-end" as any } as any,
  microValue: { fontSize: 13, fontFamily: fonts.bodySemi, color: "#2A3825" },
  microPct: { fontSize: 10, fontFamily: fonts.bodyBold, color: "#5A9A4E", marginTop: 1, letterSpacing: 0.3 },
  microFootnote: { fontSize: 10, color: "#8A9E82", marginTop: 10, fontStyle: "italic" as any, lineHeight: 14 },
  allergenSection: { marginTop: 20, marginBottom: 20 },
  allergenRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  allergenBadge: { backgroundColor: "rgba(155,68,68,0.06)", borderRadius: 10, paddingHorizontal: 11, paddingVertical: 5, borderWidth: 0.5, borderColor: "rgba(155,68,68,0.1)" },
  allergenText: { fontSize: 12, fontFamily: fonts.bodySemi, color: "#9B4444" },

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
  deleteBtnText: { color: "#9B4444", fontFamily: fonts.bodyBold, fontSize: 11 },
  addSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 0.5, borderTopColor: "rgba(42,56,37,0.12)" },
  addLabel: { fontSize: 13, fontFamily: fonts.bodyBold, color: "#2A3825", marginBottom: 4 },
  addWarning: { fontSize: 10, color: "#9B4444", marginBottom: 10, lineHeight: 14 },
  addRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12, marginTop: 4 },
  addBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(122,170,110,0.1)",
    borderWidth: 0.5, borderColor: "rgba(122,170,110,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  addBtnText: { color: "#5A9A4E", fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 18 },
  recalcBtn: {
    backgroundColor: G, borderRadius: 14, padding: 13, alignItems: "center",
    marginTop: 10, marginBottom: 4,
    boxShadow: "0 3px 12px rgba(42,56,37,0.18)",
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)",
  } as any,
  recalcBtnText: { color: "#fff", fontFamily: fonts.bodyBold, fontSize: 13 },
  editErrorBox: {
    backgroundColor: "rgba(155,68,68,0.08)", borderRadius: 12, padding: 10, marginTop: 8,
    borderWidth: 0.5, borderColor: "rgba(155,68,68,0.15)",
  },
  editErrorText: { color: "#9B4444", fontSize: 12 },
});
