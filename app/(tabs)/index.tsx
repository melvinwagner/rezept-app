import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { generateRecipe, setApiKey, getApiKey, recalculateNutrition } from "../../services/api";
import { saveRecipe, getCookbooks, addCookbook } from "../../services/storage";
import { Recipe, Ingredient, Macros } from "../../types/recipe";

const ADD_UNIT_OPTIONS = ["g", "ml"];

function UnitPicker({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {ADD_UNIT_OPTIONS.map((unit) => (
        <Pressable
          key={unit}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: value === unit ? "#7BAA6E" : "#E2EBD8",
            cursor: "pointer" as any,
          }}
          onPress={() => onChange(unit)}
        >
          <Text style={{
            fontSize: 13,
            fontWeight: "bold",
            color: value === unit ? "#fff" : "#6E8868",
          }}>{unit}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentServings, setCurrentServings] = useState<number>(0);
  const [originalServings, setOriginalServings] = useState<number>(0);
  const [showMicro, setShowMicro] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [newIngName, setNewIngName] = useState("");
  const [newIngAmount, setNewIngAmount] = useState("");
  const [newIngUnit, setNewIngUnit] = useState("");
  const [newIngSearch, setNewIngSearch] = useState("");
  const [showCookbookPicker, setShowCookbookPicker] = useState(false);
  const [cookbooks, setCookbooks] = useState<string[]>([]);
  const [newCookbookName, setNewCookbookName] = useState("");

  useEffect(() => {
    // Load API keys from storage on mount
    AsyncStorage.getItem("claude_api_key").then((key) => {
      if (key) setApiKey(key);
    });
  }, []);

  const handleGenerate = async () => {
    const trimmed = url.trim();
    setError("");
    setSuccess("");

    if (!trimmed) {
      setError("Bitte gib eine URL ein.");
      return;
    }

    if (!getApiKey()) {
      setError("Bitte zuerst den API Key in den Einstellungen setzen.");
      return;
    }

    setLoading(true);
    setRecipe(null);
    try {
      const result = await generateRecipe(trimmed);
      setRecipe(result);
      setOriginalServings(result.servings);
      setCurrentServings(result.servings);
    } catch (err: any) {
      setError(err.message || "Etwas ist schiefgelaufen.");
    } finally {
      setLoading(false);
    }
  };

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
      search: newIngSearch.trim() || newIngName.trim(),
    };
    setRecipe({ ...recipe, ingredients: [...recipe.ingredients, newIng] });
    setNewIngName("");
    setNewIngAmount("");
    setNewIngUnit("");
    setNewIngSearch("");
  };

  const handleRecalculate = async () => {
    if (!recipe) return;
    setRecalculating(true);
    try {
      const result = await recalculateNutrition(recipe.ingredients, originalServings);
      setRecipe({
        ...recipe,
        nutritionPerServing: result.nutritionPerServing,
        nutritionPer100g: result.nutritionPer100g,
        micronutrients: result.micronutrients,
      });
      setEditMode(false);
    } catch (err: any) {
      setError("Nährwerte konnten nicht neu berechnet werden.");
    } finally {
      setRecalculating(false);
    }
  };

  const handleSavePress = async () => {
    if (!recipe) return;
    const books = await getCookbooks();
    // "Meine Rezepte" immer als Default sicherstellen
    if (!books.includes("Meine Rezepte")) {
      await addCookbook("Meine Rezepte");
      books.unshift("Meine Rezepte");
    }
    setCookbooks(books);
    setShowCookbookPicker(true);
  };

  const doSave = async (cookbook: string) => {
    if (!recipe) return;
    setError("");
    setShowCookbookPicker(false);
    try {
      await saveRecipe({ ...recipe, cookbook });
      setSuccess(`In "${cookbook}" gespeichert!`);
    } catch {
      setError("Rezept konnte nicht gespeichert werden.");
    }
  };

  const handleCreateCookbook = async () => {
    const name = newCookbookName.trim();
    if (!name) return;
    await addCookbook(name);
    setNewCookbookName("");
    setCookbooks([...cookbooks, name]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {!recipe && (
          <>
            <View style={styles.header}>
              <Image source={require("../../assets/hero.png")} style={styles.heroImage} />
              <Text style={styles.title}>Video zu Rezept</Text>
              <Text style={styles.subtitle}>
                Füge einen TikTok oder Instagram Link ein und erhalte ein
                übersichtliches Rezept.
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="https://www.tiktok.com/..."
                placeholderTextColor="#A8B8A2"
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <Pressable
                role="button"
                style={[
                  styles.button,
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleGenerate}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Rezept erstellen</Text>
                )}
              </Pressable>
            </View>
          </>
        )}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}

        {recipe ? (
          <View style={styles.previewCard}>
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
                  <Pressable
                    style={styles.creatorBadge}
                    onPress={() => recipe.creatorUrl && Linking.openURL(recipe.creatorUrl)}
                  >
                    <Text style={styles.creatorPlatform}>{recipe.creatorPlatform}</Text>
                    <Text style={styles.creatorHandle}>{recipe.creatorHandle}</Text>
                  </Pressable>
                )}
              </View>
              <View style={styles.recipeHeaderText}>
                <Text style={styles.recipeTitle}>{recipe.title}</Text>
                <Text style={styles.recipeDesc}>{recipe.description}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Portionen</Text>
                <View style={styles.servingsRow}>
                  <Pressable
                    style={styles.servingsButton}
                    onPress={() => currentServings > 1 && setCurrentServings(currentServings - 1)}
                  >
                    <Text style={styles.servingsButtonText}>-</Text>
                  </Pressable>
                  <Text style={styles.servingsValue}>{currentServings}</Text>
                  <Pressable
                    style={styles.servingsButton}
                    onPress={() => setCurrentServings(currentServings + 1)}
                  >
                    <Text style={styles.servingsButtonText}>+</Text>
                  </Pressable>
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

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Zutaten</Text>
              <Pressable onPress={() => setEditMode(!editMode)} style={styles.editButton}>
                <Text style={styles.editButtonText}>{editMode ? "✓" : "✎"}</Text>
              </Pressable>
            </View>

            {editMode ? (
              <View>
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
                    <Pressable onPress={() => handleDeleteIngredient(i)} style={styles.deleteButton}>
                      <Text style={styles.deleteButtonText}>X</Text>
                    </Pressable>
                  </View>
                ))}

                <View style={styles.addSection}>
                  <Text style={styles.addLabel}>Zutat hinzufügen</Text>
                  <Text style={styles.addWarning}>Hinzugefügte Zutaten können die Nährwertangaben verfälschen, da die Daten aus einer externen Datenbank stammen.</Text>
                  <View style={styles.addRow}>
                    <TextInput
                      style={styles.editAmount}
                      value={newIngAmount}
                      onChangeText={setNewIngAmount}
                      keyboardType="numeric"
                      placeholder="100"
                      placeholderTextColor="#C2D0BC"
                    />
                    <UnitPicker
                      value={newIngUnit || null}
                      onChange={(v) => setNewIngUnit(v || "")}
                    />
                    <TextInput
                      style={styles.editName}
                      value={newIngName}
                      onChangeText={setNewIngName}
                      placeholder="z.B. Shrimps"
                      placeholderTextColor="#C2D0BC"
                    />
                    <Pressable onPress={handleAddIngredient} style={styles.addButton}>
                      <Text style={styles.addButtonText}>+</Text>
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  style={[styles.recalcButton, recalculating && styles.buttonDisabled]}
                  onPress={handleRecalculate}
                >
                  {recalculating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.recalcButtonText}>Nährwerte neu berechnen</Text>
                  )}
                </Pressable>
              </View>
            ) : (
              recipe.ingredients.map((ing, i) => {
                const scale = originalServings > 0 ? currentServings / originalServings : 1;
                let display = "";
                if (ing.amount != null) {
                  let scaled = ing.amount * scale;
                  if (scaled >= 100) scaled = Math.round(scaled / 5) * 5;
                  else if (scaled >= 10) scaled = Math.round(scaled);
                  else scaled = Math.round(scaled * 10) / 10;
                  const amountStr = scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);
                  display = ing.unit ? `${amountStr} ${ing.unit} ${ing.name}` : `${amountStr} ${ing.name}`;
                } else {
                  display = ing.name;
                }
                return (
                  <Text key={i} style={styles.ingredient}>
                    • {display}
                  </Text>
                );
              })
            )}

            <Text style={styles.sectionTitle}>Zubereitung</Text>
            {recipe.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <Text style={styles.stepNumber}>{i + 1}</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}

            <Pressable
              role="button"
              style={[styles.saveButton]}
              onPress={handleSavePress}
            >
              <Text style={styles.saveButtonText}>Rezept speichern</Text>
            </Pressable>

            {showCookbookPicker && (
              <View style={styles.cookbookPicker}>
                <Text style={styles.cookbookPickerTitle}>In welche Kategorie?</Text>

                {cookbooks.map((name) => (
                  <Pressable
                    key={name}
                    style={styles.cookbookOption}
                    onPress={() => doSave(name)}
                  >
                    <Text style={styles.cookbookOptionText}>{name}</Text>
                  </Pressable>
                ))}

                <View style={styles.newCookbookRow}>
                  <TextInput
                    style={styles.newCookbookInput}
                    value={newCookbookName}
                    onChangeText={setNewCookbookName}
                    placeholder="Neues Kochbuch..."
                    placeholderTextColor="#A8B8A2"
                  />
                  <Pressable style={styles.newCookbookButton} onPress={handleCreateCookbook}>
                    <Text style={styles.newCookbookButtonText}>+</Text>
                  </Pressable>
                </View>
              </View>
            )}

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

                <Pressable
                  style={styles.microButton}
                  onPress={() => setShowMicro(!showMicro)}
                >
                  <Text style={styles.microButtonText}>
                    {showMicro ? "Mikronährstoffe ausblenden" : "Mikronährstoffe anzeigen"}
                  </Text>
                </Pressable>

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

            <Pressable
              style={styles.newRecipeButton}
              onPress={() => { setRecipe(null); setUrl(""); setSuccess(""); setError(""); }}
            >
              <Text style={styles.newRecipeButtonText}>+ Neues Rezept</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const G = "rgba(42, 56, 37, 0.55)"; // glass dark (same as tab bar)
const W = (a: number) => `rgba(255,255,255,${a})`;
const M = (a: number) => `rgba(123,170,110,${a})`;

const styles = StyleSheet.create({
  // === BASE ===
  container: { flex: 1, backgroundColor: "#EEF2EA" },
  scrollContent: { padding: 16, paddingBottom: 110 },

  // === LANDING ===
  header: { alignItems: "center", marginBottom: 28, marginTop: 8 },
  heroImage: { width: 90, height: 90, borderRadius: 45, marginBottom: 14, borderWidth: 2, borderColor: W(0.6) },
  title: { fontSize: 26, fontWeight: "700", color: "#2A3825", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: "#8A9E82", textAlign: "center", marginTop: 6, lineHeight: 19, paddingHorizontal: 20 },

  // === INPUT ===
  inputContainer: { marginBottom: 20 },
  input: {
    backgroundColor: W(0.65), borderRadius: 18, padding: 16, fontSize: 15,
    borderWidth: 0.5, borderColor: W(0.8), marginBottom: 12,
    backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
  } as any,
  button: {
    backgroundColor: G, borderRadius: 18, padding: 15, alignItems: "center",
    cursor: "pointer" as any,
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    boxShadow: "0 4px 20px rgba(42,56,37,0.2)",
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)",
  } as any,
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "600", letterSpacing: 0.3 },

  // === ALERTS ===
  errorBox: { backgroundColor: "rgba(155,68,68,0.07)", borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 0.5, borderColor: "rgba(155,68,68,0.12)" },
  errorText: { color: "#9B4444", fontSize: 13 },
  successBox: { backgroundColor: M(0.08), borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 0.5, borderColor: M(0.12) },
  successText: { color: "#4A8A3E", fontSize: 13 },

  // === RECIPE CARD ===
  previewCard: {
    backgroundColor: W(0.6), borderRadius: 24, padding: 20,
    borderWidth: 0.5, borderColor: W(0.8),
    boxShadow: "0 8px 32px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
    backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
    overflow: "hidden" as any,
  } as any,

  // === RECIPE HEADER ===
  recipeHeader: { flexDirection: "row", marginBottom: 18, gap: 14, alignItems: "flex-start" as any },
  recipeImageCol: { alignItems: "center" as any, flexShrink: 0 },
  recipeImage: { width: 100, height: 120, borderRadius: 16 },
  recipeHeaderText: { flex: 1, justifyContent: "flex-start" as any, paddingTop: 2 },
  creatorBadge: {
    alignItems: "center", backgroundColor: G, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4, marginTop: 8, width: 100,
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.1)",
  },
  creatorPlatform: { fontSize: 8, fontWeight: "500" as any, color: "rgba(255,255,255,0.5)", marginBottom: 1, textAlign: "center" as any },
  creatorHandle: { fontSize: 8, fontWeight: "600" as any, color: "rgba(255,255,255,0.85)", textAlign: "center" as any },
  recipeTitle: { fontSize: 19, fontWeight: "700" as any, color: "#2A3825", lineHeight: 25, marginBottom: 5, letterSpacing: -0.3 },
  recipeDesc: { fontSize: 12.5, color: "#6E8868", lineHeight: 18 },

  // === META ROW ===
  metaRow: {
    flexDirection: "row", justifyContent: "space-between",
    backgroundColor: G, borderRadius: 16, padding: 12, marginBottom: 22,
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
  } as any,
  metaItem: { alignItems: "center", flex: 1, paddingHorizontal: 2 },
  metaLabel: { fontSize: 9, color: "rgba(255,255,255,0.45)", marginBottom: 3, textAlign: "center" as any, letterSpacing: 0.3 },
  metaValue: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.9)", textAlign: "center" as any },
  servingsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  servingsButton: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center", cursor: "pointer" as any,
  },
  servingsButtonText: { color: "rgba(255,255,255,0.9)", fontSize: 10, fontWeight: "600", lineHeight: 12, textAlign: "center" as any },
  servingsValue: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.9)", minWidth: 12, textAlign: "center" as any },

  // === SECTIONS ===
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#2A3825", marginBottom: 12, marginTop: 10, letterSpacing: -0.2 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 10 },

  // === INGREDIENTS ===
  ingredient: { fontSize: 14, color: "#2A3825", marginBottom: 7, lineHeight: 21, paddingLeft: 2 },

  // === STEPS ===
  stepRow: {
    flexDirection: "row", marginBottom: 10, alignItems: "flex-start",
    backgroundColor: W(0.35), borderRadius: 14, padding: 12,
    borderWidth: 0.5, borderColor: W(0.5),
  },
  stepNumber: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: G, color: "#fff", textAlign: "center",
    lineHeight: 24, fontSize: 12, fontWeight: "600", marginRight: 12,
    overflow: "hidden" as any,
  },
  stepText: { flex: 1, fontSize: 14, color: "#2A3825", lineHeight: 21 },

  // === SAVE ===
  saveButton: {
    backgroundColor: G, borderRadius: 18, padding: 16, alignItems: "center",
    marginTop: 22, cursor: "pointer" as any,
    boxShadow: "0 6px 24px rgba(42,56,37,0.18)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
  } as any,
  saveButtonText: { color: "#fff", fontSize: 15, fontWeight: "600", letterSpacing: 0.3 },

  // === EDIT MODE ===
  editButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: "transparent", alignItems: "center", justifyContent: "center", cursor: "pointer" as any },
  editButtonText: { fontSize: 18, color: "#7BAA6E" },
  editRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 6 },
  editAmount: { width: 50, backgroundColor: W(0.55), borderRadius: 10, padding: 8, fontSize: 13, borderWidth: 0.5, borderColor: W(0.7), textAlign: "center" as any },
  editUnit: { width: 45, backgroundColor: W(0.55), borderRadius: 10, padding: 8, fontSize: 13, borderWidth: 0.5, borderColor: W(0.7), textAlign: "center" as any },
  editUnitLabel: { width: 30, fontSize: 13, color: "#98AE92", textAlign: "center" as any },
  editNameLabel: { flex: 1, fontSize: 13, color: "#2A3825" },
  editName: { flex: 1, backgroundColor: W(0.55), borderRadius: 10, padding: 8, fontSize: 13, borderWidth: 0.5, borderColor: W(0.7) },
  addSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 0.5, borderTopColor: M(0.1) },
  addLabel: { fontSize: 13, fontWeight: "600", color: "#2A3825", marginBottom: 4 },
  addWarning: { fontSize: 10, color: "#9B4444", marginBottom: 10, lineHeight: 15 },
  deleteButton: { width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(155,68,68,0.07)", borderWidth: 0.5, borderColor: "rgba(155,68,68,0.12)", alignItems: "center", justifyContent: "center", cursor: "pointer" as any },
  deleteButtonText: { color: "#9B4444", fontWeight: "600", fontSize: 11 },
  addRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 6, marginTop: 4 },
  addButton: { width: 26, height: 26, borderRadius: 13, backgroundColor: M(0.08), borderWidth: 0.5, borderColor: M(0.15), alignItems: "center", justifyContent: "center", cursor: "pointer" as any },
  addButtonText: { color: "#5A9A4E", fontWeight: "600", fontSize: 15, lineHeight: 17 },
  recalcButton: { backgroundColor: G, borderRadius: 14, padding: 12, alignItems: "center", marginTop: 8, marginBottom: 8, cursor: "pointer" as any, boxShadow: "0 2px 10px rgba(42,56,37,0.15)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)" } as any,
  recalcButtonText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  // === COOKBOOK PICKER ===
  cookbookPicker: { backgroundColor: W(0.45), borderRadius: 18, padding: 16, marginTop: 14, borderWidth: 0.5, borderColor: W(0.65), backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" } as any,
  cookbookPickerTitle: { fontSize: 15, fontWeight: "600", color: "#2A3825", marginBottom: 12 },
  cookbookOption: { backgroundColor: W(0.55), borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 0.5, borderColor: W(0.7), cursor: "pointer" as any },
  cookbookOptionText: { fontSize: 14, color: "#2A3825" },
  newCookbookRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  newCookbookInput: { flex: 1, backgroundColor: W(0.55), borderRadius: 14, padding: 12, fontSize: 13, borderWidth: 0.5, borderColor: W(0.7) },
  newCookbookButton: { width: 44, backgroundColor: G, borderRadius: 14, alignItems: "center", justifyContent: "center", cursor: "pointer" as any, borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)" },
  newCookbookButtonText: { color: "#fff", fontSize: 18, fontWeight: "600" },

  // === NUTRITION ===
  nutritionSection: { marginTop: 24 },
  nutritionSubtitle: { fontSize: 13, fontWeight: "600", color: "#8A9E82", marginBottom: 8, marginTop: 12, letterSpacing: 0.3, textTransform: "uppercase" as any },
  nutritionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  nutritionItem: { backgroundColor: W(0.4), borderRadius: 14, paddingVertical: 10, paddingHorizontal: 6, alignItems: "center", minWidth: 58, flex: 1, borderWidth: 0.5, borderColor: W(0.6) },
  nutritionValue: { fontSize: 15, fontWeight: "700", color: "#5A9A4E" },
  nutritionLabel: { fontSize: 9, color: "#98AE92", marginTop: 2, textAlign: "center" as any },
  microButton: { backgroundColor: W(0.35), borderRadius: 14, padding: 12, alignItems: "center", marginTop: 16, cursor: "pointer" as any, borderWidth: 0.5, borderColor: W(0.5) },
  microButtonText: { fontSize: 13, fontWeight: "600", color: "#6E8868" },
  microGrid: { backgroundColor: W(0.35), borderRadius: 14, padding: 12, marginTop: 10, borderWidth: 0.5, borderColor: W(0.5) },
  microRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: M(0.06) },
  microName: { fontSize: 13, color: "#6E8868" },
  microValue: { fontSize: 13, fontWeight: "600", color: "#2A3825" },

  // === ALLERGENS ===
  allergenSection: { marginTop: 20 },
  allergenRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  allergenBadge: { backgroundColor: "rgba(155,68,68,0.06)", borderRadius: 10, paddingHorizontal: 11, paddingVertical: 5, borderWidth: 0.5, borderColor: "rgba(155,68,68,0.1)" },
  allergenText: { fontSize: 12, fontWeight: "600", color: "#9B4444" },

  // === NEW RECIPE BUTTON ===
  newRecipeButton: {
    borderRadius: 18, padding: 15, alignItems: "center", marginTop: 22,
    backgroundColor: W(0.4), borderWidth: 0.5, borderColor: W(0.6),
    cursor: "pointer" as any,
  },
  newRecipeButtonText: { color: "#5A9A4E", fontSize: 14, fontWeight: "600" },
});
