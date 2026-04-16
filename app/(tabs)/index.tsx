import { useState, useEffect, useRef, useCallback } from "react";
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
  Dimensions,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { generateRecipe, setApiKey, getApiKey, recalculateNutrition } from "../../services/api";
import { saveRecipe, getCookbooks, addCookbook } from "../../services/storage";
import { Recipe, Ingredient, Macros } from "../../types/recipe";

const ADD_UNIT_OPTIONS = ["g", "ml"];

const WIDGET_DATA = [
  { type: "wusstest", emoji: "✨", label: "Wusstest du?", text: "Zimt kann den Blutzuckerspiegel um bis zu 29% senken. Perfekt im Porridge oder Bananenbrot!" },
  { type: "tipp", emoji: "💡", label: "Tipp des Tages", text: "Reife Bananen mit braunen Flecken sind süßer — perfekt für Bananenbrot ohne extra Zucker!" },
  { type: "wusstest", emoji: "❓", label: "Wusstest du?", text: "Ein Ei enthält alle essentiellen Aminosäuren und gilt als Referenz-Protein in der Ernährungswissenschaft." },
  { type: "tipp", emoji: "🔥", label: "Tipp des Tages", text: "Knoblauch erst 10 Min nach dem Schneiden erhitzen — so bildet sich das gesunde Allicin." },
  { type: "wusstest", emoji: "✨", label: "Wusstest du?", text: "Olivenöl verliert beim starken Erhitzen seine gesunden Eigenschaften. Zum Braten besser Rapsöl nehmen." },
  { type: "tipp", emoji: "💡", label: "Tipp des Tages", text: "Reis nach dem Kochen abkühlen lassen — das senkt den glykämischen Index um bis zu 50%." },
  {
    type: "fact",
    emoji: "📊",
    label: "Food Fact",
    number: "73%",
    text: "der Deutschen kochen mindestens 3x pro Woche selbst.",
  },
  {
    type: "fact",
    emoji: "📊",
    label: "Food Fact",
    number: "2.5 Mrd",
    text: "Rezeptvideos werden monatlich auf TikTok angesehen.",
  },
  {
    type: "fact",
    emoji: "📊",
    label: "Food Fact",
    number: "40%",
    text: "weniger Lebensmittel werden verschwendet wenn man mit Einkaufsliste kocht.",
  },
  {
    type: "fact",
    emoji: "📊",
    label: "Food Fact",
    number: "8 Min",
    text: "dauert es durchschnittlich ein Rezept von Hand abzutippen. DAWG macht es in Sekunden.",
  },
] as Array<{ type: string; emoji: string; label: string; text: string; number?: string }>;

const GEMUESE_DATA = [
  { name: "Tomate", text: "Tomaten enthalten Lycopin — ein Antioxidans das beim Erhitzen sogar stärker wird.", img: require("../../assets/gemuese/tomate.jpg") },
  { name: "Brokkoli", text: "Brokkoli hat mehr Vitamin C als Orangen und ist ein echtes Superfood für das Immunsystem.", img: require("../../assets/gemuese/brokkoli.jpg") },
  { name: "Karotte", text: "Karotten verbessern tatsächlich die Sehkraft — dank Beta-Carotin, das der Körper in Vitamin A umwandelt.", img: require("../../assets/gemuese/karotte.jpg") },
  { name: "Paprika", text: "Rote Paprika enthält doppelt so viel Vitamin C wie grüne — sie ist einfach die reifere Version.", img: require("../../assets/gemuese/paprika.jpg") },
  { name: "Spinat", text: "Spinat verliert beim Kochen 90% seines Volumens. 500g roh werden zu einer kleinen Portion.", img: require("../../assets/gemuese/spinat.jpg") },
  { name: "Zucchini", text: "Zucchini besteht zu 95% aus Wasser und hat nur 17 kcal pro 100g — perfekt zum Abnehmen.", img: require("../../assets/gemuese/zucchini.jpg") },
  { name: "Aubergine", text: "Auberginen saugen Öl auf wie ein Schwamm. Tipp: vorher salzen und 20 Min warten.", img: require("../../assets/gemuese/aubergine.jpg") },
  { name: "Blumenkohl", text: "Blumenkohl kann als Low-Carb Ersatz für Reis, Pizza-Boden und sogar Kartoffelpüree dienen.", img: require("../../assets/gemuese/blumenkohl.jpg") },
  { name: "Gurke", text: "Gurken bestehen zu 96% aus Wasser — das wasserreichste Gemüse überhaupt.", img: require("../../assets/gemuese/gurke.jpg") },
  { name: "Süßkartoffel", text: "Süßkartoffeln haben einen niedrigeren glykämischen Index als normale Kartoffeln trotz süßem Geschmack.", img: require("../../assets/gemuese/suesskartoffel.jpg") },
  { name: "Kürbis", text: "Kürbiskerne enthalten mehr Eisen als Rindfleisch — ein unterschätzter Nährstoff-Booster.", img: require("../../assets/gemuese/kuerbis.jpg") },
  { name: "Avocado", text: "Avocados reifen erst nach der Ernte. Neben eine Banane legen beschleunigt den Prozess.", img: require("../../assets/gemuese/avocado.jpg") },
  { name: "Spargel", text: "Weißer und grüner Spargel sind dieselbe Pflanze — weißer wächst unter der Erde ohne Licht.", img: require("../../assets/gemuese/spargel.jpg") },
  { name: "Pilze", text: "Pilze sind die einzige pflanzliche Vitamin-D-Quelle. Kurz in die Sonne legen erhöht den Gehalt.", img: require("../../assets/gemuese/pilze.jpg") },
  { name: "Zwiebel", text: "Zwiebeln im Kühlschrank schneiden reduziert das Weinen — Kälte verlangsamt die Reizstoff-Freisetzung.", img: require("../../assets/gemuese/zwiebel.jpg") },
  { name: "Knoblauch", text: "Eine Knoblauchzehe am Tag kann den Blutdruck um bis zu 10% senken.", img: require("../../assets/gemuese/knoblauch.jpg") },
  { name: "Rosenkohl", text: "Rosenkohl schmeckt nach dem ersten Frost süßer — Kälte wandelt Stärke in Zucker um.", img: require("../../assets/gemuese/rosenkohl.jpg") },
  { name: "Radieschen", text: "Radieschen wachsen in nur 4 Wochen — das schnellste Gemüse im eigenen Garten.", img: require("../../assets/gemuese/radieschen.jpg") },
  { name: "Mangold", text: "Mangold ist eng mit der Rübe verwandt und liefert mehr Eisen als die meisten Gemüsesorten.", img: require("../../assets/gemuese/mangold.jpg") },
  { name: "Grünkohl", text: "Grünkohl hat pro Kalorie mehr Nährstoffe als fast jedes andere Lebensmittel.", img: require("../../assets/gemuese/gruenkohl.jpg") },
];

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

function GemueseDesTages() {
  const today = new Date();
  const dayIndex = (Math.floor((today.getTime() / 86400000)) + 7) % GEMUESE_DATA.length;
  const g = GEMUESE_DATA[dayIndex];

  return (
    <View style={styles.gemueseCard}>
      <View style={styles.gemueseHeader}>
        <Text style={styles.gemueseLabel}>🥬  Gemüse des Tages</Text>
      </View>
      <Image source={g.img} style={styles.gemueseImage} resizeMode="cover" />
      <Text style={styles.gemuese_name}>{g.name}</Text>
      <Text style={styles.gemueseText}>{g.text}</Text>
      <Pressable
        style={styles.gemueseBtn}
        onPress={() => Linking.openURL(`https://www.tiktok.com/search?q=${encodeURIComponent(g.name)}`)}
      >
        <Text style={styles.gemuese_btnText}>Finde jetzt passende Rezepte</Text>
      </Pressable>
    </View>
  );
}

function WidgetSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, "ja" | "nein">>({});
  const screenWidth = Dimensions.get("window").width;
  const cardWidth = screenWidth - 64;

  const handleAnswer = (index: number, answer: "ja" | "nein") => {
    setAnswers((prev) => ({ ...prev, [index]: answer }));
  };

  return (
    <View style={styles.widgetSection}>
      <ScrollView
        horizontal
        pagingEnabled={false}
        snapToInterval={cardWidth + 10}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 16 }}
        onScroll={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (cardWidth + 10));
          setActiveIndex(idx);
        }}
        scrollEventThrottle={16}
      >
        {WIDGET_DATA.map((w, i) => (
          <View key={i} style={[styles.widgetCard, { width: cardWidth, marginRight: 10 }]}>
            <View style={styles.widgetHeader}>
              <Text style={styles.widgetEmoji}>{w.emoji}</Text>
              <Text style={styles.widgetLabel}>{w.label}</Text>
            </View>
            {w.type === "fact" && w.number ? (
              <>
                <Text style={styles.factNumber}>{w.number}</Text>
                <Text style={styles.factText}>{w.text}</Text>
              </>
            ) : (
              <Text style={styles.widgetText}>{w.text}</Text>
            )}
            {w.type === "wusstest" && (
              <View style={styles.widgetActions}>
                {answers[i] ? (
                  <Text style={styles.widgetAnswered}>
                    {answers[i] === "ja" ? "👍 Danke!" : "😮 Gut zu wissen!"}
                  </Text>
                ) : (
                  <>
                    <Pressable
                      style={styles.widgetBtnJa}
                      onPress={() => handleAnswer(i, "ja")}
                    >
                      <Text style={styles.widgetBtnJaText}>Ja, wusste ich</Text>
                    </Pressable>
                    <Pressable
                      style={styles.widgetBtnNein}
                      onPress={() => handleAnswer(i, "nein")}
                    >
                      <Text style={styles.widgetBtnNeinText}>Nein, spannend!</Text>
                    </Pressable>
                  </>
                )}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      <View style={styles.widgetDots}>
        {WIDGET_DATA.map((_, i) => (
          <View key={i} style={[styles.widgetDot, activeIndex === i && styles.widgetDotActive]} />
        ))}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const scrollRef = useRef<ScrollView>(null);
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
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      setTimeout(() => setSuccess(""), 3000);
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
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {!recipe && (
          <>
            <View style={styles.proCardSmall}>
              <View style={styles.proSmallLeft}>
                <Text style={styles.proSmallTitle}>DAWG <Text style={styles.proSmallBadge}>PRO</Text></Text>
                <Text style={styles.proSmallText}>Unbegrenzt Rezepte · Keine Werbung</Text>
              </View>
              <Pressable style={styles.proSmallBtn}>
                <Text style={styles.proSmallBtnText}>Gratis testen</Text>
              </Pressable>
            </View>

            <View style={styles.header}>
              <Text style={styles.tagline}>
                Jedes <Text style={styles.taglineAccent}>Video</Text>
                {"\n"}wird zum <Text style={styles.taglineAccent}>Rezept</Text>.
              </Text>
            </View>

            <View style={styles.inputCard}>
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
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleGenerate}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Rezept erstellen</Text>
                )}
              </Pressable>
              <View style={styles.supported}>
                <View style={styles.supportedItem}><View style={styles.supportedDot} /><Text style={styles.supportedText}>TikTok</Text></View>
                <View style={styles.supportedItem}><View style={styles.supportedDot} /><Text style={styles.supportedText}>Instagram</Text></View>
                <View style={styles.supportedItem}><View style={styles.supportedDot} /><Text style={styles.supportedText}>YouTube</Text></View>
              </View>
            </View>

            <GemueseDesTages />

            <WidgetSlider />

            <View style={styles.adPlaceholderLarge}>
              <Text style={styles.adLabel}>Werbung</Text>
            </View>
          </>
        )}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {null}

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
              <Text style={styles.newRecipeButtonText}>Lust auf ein weiteres Rezept?</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
      {success ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{success}</Text>
        </View>
      ) : null}
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
  header: { alignItems: "center", marginBottom: 4, marginTop: 6 },
  tagline: { fontSize: 36, fontWeight: "900", color: "#2A3825", textAlign: "center", lineHeight: 42, letterSpacing: -1.5 },
  taglineAccent: { color: "#7BAA6E" },
  adPlaceholder: {
    width: "100%" as any,
    height: 80,
    marginBottom: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(42,56,37,0.1)",
    borderStyle: "dashed" as any,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    backgroundColor: "rgba(42,56,37,0.03)",
  },
  adLabel: { fontSize: 9, color: "rgba(42,56,37,0.2)", fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" as any },
  adPlaceholderLarge: {
    width: "100%" as any,
    height: 200,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(42,56,37,0.1)",
    borderStyle: "dashed" as any,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    backgroundColor: "rgba(42,56,37,0.03)",
  },

  // === INPUT CARD ===
  inputCard: {
    backgroundColor: W(0.6), borderRadius: 22, padding: 20, marginTop: 4,
    borderWidth: 0.5, borderColor: W(0.8),
    backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
    boxShadow: "0 6px 28px rgba(0,0,0,0.06)",
  } as any,
  supported: { flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 14 },
  supportedItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  supportedDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#7BAA6E" },
  supportedText: { fontSize: 10, color: "#98AE92", fontWeight: "500" },
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
  toast: {
    position: "absolute" as any, top: 10, left: 20, right: 20,
    backgroundColor: G, borderRadius: 16, padding: 16,
    alignItems: "center" as any,
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.1)",
    boxShadow: "0 8px 32px rgba(42,56,37,0.3)",
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    zIndex: 100,
  } as any,
  toastText: { color: "#fff", fontSize: 14, fontWeight: "600" },

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
    borderRadius: 18, padding: 16, alignItems: "center", marginTop: 22,
    backgroundColor: G, cursor: "pointer" as any,
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)",
    boxShadow: "0 6px 24px rgba(42,56,37,0.18)",
  } as any,
  newRecipeButtonText: { color: "#fff", fontSize: 15, fontWeight: "600", letterSpacing: 0.3 },

  // === DAWG PRO CTA (compact) ===
  proCardSmall: {
    backgroundColor: G, borderRadius: 16, padding: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    marginBottom: 10, height: 76,
  } as any,
  proSmallLeft: { flex: 1 },
  proSmallTitle: { color: "#fff", fontSize: 16, fontWeight: "800", marginBottom: 3 },
  proSmallBadge: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  proSmallText: { color: "rgba(255,255,255,0.45)", fontSize: 10 },
  proSmallBtn: {
    backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.2)", marginLeft: 12,
  },
  proSmallBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  // === GEMÜSE DES TAGES ===
  gemueseCard: {
    backgroundColor: W(0.55), borderRadius: 22, padding: 18, marginTop: 16,
    borderWidth: 0.5, borderColor: W(0.75),
    backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
    overflow: "hidden" as any,
  } as any,
  gemueseHeader: { marginBottom: 12 },
  gemueseLabel: { fontSize: 10, fontWeight: "700", color: "#8A9E82", letterSpacing: 0.5, textTransform: "uppercase" as any },
  gemueseImage: { width: "100%" as any, height: 160, borderRadius: 14, marginBottom: 12 },
  gemuese_name: { fontSize: 20, fontWeight: "800", color: "#2A3825", letterSpacing: -0.3, marginBottom: 4 },
  gemueseText: { fontSize: 13, color: "#6E8868", lineHeight: 19, marginBottom: 14 },
  gemueseBtn: {
    backgroundColor: G, borderRadius: 14, padding: 13, alignItems: "center",
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)",
  },
  gemuese_btnText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  // === WIDGET SLIDER ===
  widgetSection: { marginBottom: 10 },
  widgetCard: {
    backgroundColor: W(0.55), borderRadius: 20, padding: 18,
    borderWidth: 0.5, borderColor: W(0.75),
    backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
  } as any,
  widgetHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  widgetEmoji: { fontSize: 32 },
  widgetLabel: { fontSize: 15, fontWeight: "700", color: "#2A3825", letterSpacing: -0.2 },
  widgetText: { fontSize: 14, color: "#2A3825", lineHeight: 21 },
  factNumber: { fontSize: 32, fontWeight: "800", color: "#5A9A4E", textAlign: "center" as any, marginVertical: 6, letterSpacing: -1 },
  factText: { fontSize: 12, color: "#8A9E82", textAlign: "center" as any, lineHeight: 17 },
  widgetActions: { flexDirection: "row", gap: 8, marginTop: 14 },
  widgetBtnJa: {
    flex: 1, backgroundColor: G, borderRadius: 12, padding: 10, alignItems: "center",
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)",
  },
  widgetBtnJaText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  widgetBtnNein: {
    flex: 1, backgroundColor: W(0.45), borderRadius: 12, padding: 10, alignItems: "center",
    borderWidth: 0.5, borderColor: W(0.65),
  },
  widgetBtnNeinText: { color: "#5A9A4E", fontSize: 12, fontWeight: "600" },
  widgetAnswered: { fontSize: 13, color: "#7BAA6E", fontWeight: "600", marginTop: 4 },
  widgetDots: { flexDirection: "row", justifyContent: "center", gap: 5, marginTop: 12 },
  widgetDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(42,56,37,0.12)" },
  widgetDotActive: { backgroundColor: "#7BAA6E", width: 18 },
});
