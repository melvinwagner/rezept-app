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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { generateRecipe, setApiKey, getApiKey } from "../../services/api";
import { saveRecipe } from "../../services/storage";
import { Recipe } from "../../types/recipe";

export default function HomeScreen() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Load API key from storage on mount
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
    } catch (err: any) {
      setError(err.message || "Etwas ist schiefgelaufen.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!recipe) return;
    setError("");
    try {
      await saveRecipe(recipe);
      setSuccess("Rezept gespeichert!");
    } catch {
      setError("Rezept konnte nicht gespeichert werden.");
    }
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
          <Text style={styles.emoji}>🍳</Text>
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
            <Text style={styles.recipeTitle}>{recipe.title}</Text>
            <Text style={styles.recipeDesc}>{recipe.description}</Text>

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
            {recipe.ingredients.map((item, i) => (
              <Text key={i} style={styles.ingredient}>
                • {item}
              </Text>
            ))}

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
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Rezept speichern ★</Text>
            </Pressable>
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
  emoji: { fontSize: 48, marginBottom: 8 },
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
  },
  recipeTitle: { fontSize: 24, fontWeight: "bold", color: "#333", marginBottom: 8 },
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
});
