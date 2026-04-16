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
            backgroundColor: value === unit ? "#FF6B35" : "#f0f0f0",
            cursor: "pointer" as any,
          }}
          onPress={() => onChange(unit)}
        >
          <Text style={{
            fontSize: 13,
            fontWeight: "bold",
            color: value === unit ? "#fff" : "#666",
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
            placeholderTextColor="#aaa"
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

        {recipe && (
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
                    <Text style={styles.creatorSeparator}> | </Text>
                    <Text style={styles.creatorHandle}>{recipe.creatorHandle}</Text>
                  </Pressable>
                )}
              </View>
              <View style={styles.recipeHeaderText}>
                <Text style={styles.recipeTitle}>{recipe.title}</Text>
                <Text style={styles.recipeDesc} numberOfLines={3}>{recipe.description}</Text>
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
                <Text style={styles.editButtonText}>{editMode ? "Fertig" : "Bearbeiten"}</Text>
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
                      placeholderTextColor="#ccc"
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
                      placeholderTextColor="#ccc"
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
                      placeholderTextColor="#ccc"
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
              <Text style={styles.saveButtonText}>Rezept speichern ★</Text>
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
                    placeholderTextColor="#aaa"
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
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F0" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 24 },
  heroImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: "bold", color: "#333" },
  subtitle: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  inputContainer: { marginBottom: 20 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#FF6B35",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    cursor: "pointer" as any,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  errorBox: {
    backgroundColor: "#FDECEA",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F5C6CB",
  },
  errorText: { color: "#B71C1C", fontSize: 14 },
  successBox: {
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  successText: { color: "#2E7D32", fontSize: 14 },
  previewCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)" as any,
    overflow: "hidden" as any,
  },
  recipeHeader: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 14,
  },
  recipeImageCol: {
    alignItems: "center" as any,
  },
  recipeImage: {
    width: 100,
    height: 120,
    borderRadius: 10,
  },
  recipeHeaderText: {
    flex: 1,
    justifyContent: "center" as any,
  },
  creatorBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3EB",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4,
  },
  creatorPlatform: { fontSize: 11, fontWeight: "600" as any, color: "#999" },
  creatorSeparator: { fontSize: 11, color: "#ccc" },
  creatorHandle: { fontSize: 11, fontWeight: "700" as any, color: "#FF6B35" },
  recipeTitle: { fontSize: 24, fontWeight: "bold" as any, color: "#333" },
  recipeDesc: { fontSize: 14, color: "#666", marginBottom: 16, lineHeight: 20 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFF3EB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  metaItem: { alignItems: "center", flex: 1 },
  metaLabel: { fontSize: 11, color: "#999", marginBottom: 4 },
  metaValue: { fontSize: 14, fontWeight: "600", color: "#FF6B35" },
  servingsRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  servingsButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer" as any,
  },
  servingsButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold", lineHeight: 20 },
  servingsValue: { fontSize: 18, fontWeight: "bold", color: "#FF6B35", minWidth: 20, textAlign: "center" as any },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    marginTop: 8,
  },
  ingredient: { fontSize: 15, color: "#555", marginBottom: 6, lineHeight: 22 },
  stepRow: { flexDirection: "row", marginBottom: 12 },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FF6B35",
    color: "#fff",
    textAlign: "center",
    lineHeight: 28,
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 12,
  },
  stepText: { flex: 1, fontSize: 15, color: "#555", lineHeight: 22 },
  saveButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
    cursor: "pointer" as any,
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  editButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    cursor: "pointer" as any,
  },
  editButtonText: { fontSize: 13, fontWeight: "600", color: "#666" },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  editAmount: {
    width: 50,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#eee",
    textAlign: "center" as any,
  },
  editUnit: {
    width: 45,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#eee",
    textAlign: "center" as any,
  },
  editUnitLabel: {
    width: 30,
    fontSize: 14,
    color: "#999",
    textAlign: "center" as any,
  },
  editNameLabel: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  editName: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },
  addSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  addLabel: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 4 },
  addWarning: { fontSize: 11, color: "#B71C1C", marginBottom: 10, lineHeight: 16 },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FDECEA",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer" as any,
  },
  deleteButtonText: { color: "#B71C1C", fontWeight: "bold", fontSize: 13 },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
    marginTop: 4,
  },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer" as any,
  },
  addButtonText: { color: "#2E7D32", fontWeight: "bold", fontSize: 18, lineHeight: 20 },
  recalcButton: {
    backgroundColor: "#FF6B35",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
    cursor: "pointer" as any,
  },
  recalcButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  cookbookPicker: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cookbookPickerTitle: { fontSize: 15, fontWeight: "bold", color: "#333", marginBottom: 12 },
  cookbookOption: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eee",
    cursor: "pointer" as any,
  },
  cookbookOptionText: { fontSize: 15, color: "#333" },
  newCookbookRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  newCookbookInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },
  newCookbookButton: {
    width: 44,
    backgroundColor: "#FF6B35",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer" as any,
  },
  newCookbookButtonText: { color: "#fff", fontSize: 22, fontWeight: "bold" },
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
    cursor: "pointer" as any,
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
  allergenSection: { marginTop: 20 },
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
