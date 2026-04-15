import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setApiKey, getApiKey } from "../../services/api";

const API_KEY_STORAGE = "claude_api_key";

export default function SettingsScreen() {
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");
  const [syncUnlocked, setSyncUnlocked] = useState(false);
  const [syncPassword, setSyncPassword] = useState("");

  useEffect(() => {
    loadKey();
  }, []);

  const loadKey = async () => {
    const stored = await AsyncStorage.getItem(API_KEY_STORAGE);
    if (stored) {
      setKey(stored);
      setApiKey(stored);
      setSaved(true);
    }
  };

  const handleSave = async () => {
    const trimmed = key.trim();
    if (!trimmed) return;
    await AsyncStorage.setItem(API_KEY_STORAGE, trimmed);
    setApiKey(trimmed);
    setSaved(true);
  };

  const handleClear = async () => {
    await AsyncStorage.removeItem(API_KEY_STORAGE);
    setKey("");
    setApiKey("");
    setSaved(false);
  };

  const buildSyncData = async () => {
    const recipesRaw = await AsyncStorage.getItem("saved_recipes");
    const cookbooksRaw = await AsyncStorage.getItem("cookbooks");
    const claudeKey = await AsyncStorage.getItem(API_KEY_STORAGE);

    let serverKeys = { groq: "", usda: "", pexels: "" };
    try {
      const skRes = await fetch("http://localhost:3001/api/server-keys");
      if (skRes.ok) serverKeys = await skRes.json();
    } catch {}

    return {
      _info: "Rezept App - LocalSync Datei. Importiere diese in den Einstellungen der App.",
      exportDate: new Date().toISOString(),
      apiKeys: {
        claude: claudeKey || "",
        groq: serverKeys.groq || "",
        usda: serverKeys.usda || "",
        pexels: serverKeys.pexels || "",
      },
      recipes: recipesRaw ? JSON.parse(recipesRaw) : [],
      cookbooks: cookbooksRaw ? JSON.parse(cookbooksRaw) : [],
    };
  };

  // ===== EXPORT (Download) =====
  const handleExport = async () => {
    try {
      const syncData = await buildSyncData();
      const json = JSON.stringify(syncData, null, 2);

      if (Platform.OS === "web") {
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `localsync_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setSyncStatus("Export erfolgreich heruntergeladen!");
      }
    } catch (err) {
      setSyncStatus("Export fehlgeschlagen.");
    }
  };

  // ===== TEILEN (per E-Mail mit Anhang) =====
  const handleShare = async () => {
    try {
      setSyncStatus("E-Mail wird gesendet...");
      const syncData = await buildSyncData();

      const response = await fetch("http://localhost:3001/api/send-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncData }),
      });

      if (!response.ok) {
        const err = await response.json();
        setSyncStatus("Fehler: " + (err.error || "Unbekannt"));
        return;
      }

      const recipeCount = syncData.recipes?.length || 0;
      setSyncStatus(`E-Mail mit ${recipeCount} Rezepten an melvin.wagner97@gmail.com & paul.schlatte@gmail.com gesendet!`);
    } catch (err: any) {
      setSyncStatus("E-Mail konnte nicht gesendet werden: " + (err.message || "Server nicht erreichbar"));
    }
  };

  // ===== IMPORT =====
  const handleImport = () => {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          const data = JSON.parse(text);

          // API Key importieren
          if (data.apiKeys?.claude) {
            await AsyncStorage.setItem(API_KEY_STORAGE, data.apiKeys.claude);
            setApiKey(data.apiKeys.claude);
            setKey(data.apiKeys.claude);
            setSaved(true);
          }

          // Rezepte importieren (merge mit bestehenden)
          if (data.recipes && Array.isArray(data.recipes)) {
            const existingRaw = await AsyncStorage.getItem("saved_recipes");
            const existing = existingRaw ? JSON.parse(existingRaw) : [];
            const existingIds = new Set(existing.map((r: any) => r.id));
            const newRecipes = data.recipes.filter((r: any) => !existingIds.has(r.id));
            const merged = [...newRecipes, ...existing];
            await AsyncStorage.setItem("saved_recipes", JSON.stringify(merged));
          }

          // Kochbücher importieren (merge)
          if (data.cookbooks && Array.isArray(data.cookbooks)) {
            const existingRaw = await AsyncStorage.getItem("cookbooks");
            const existing = existingRaw ? JSON.parse(existingRaw) : [];
            const merged = [...new Set([...existing, ...data.cookbooks])];
            await AsyncStorage.setItem("cookbooks", JSON.stringify(merged));
          }

          // Server-Keys importieren (.env schreiben)
          if (data.apiKeys?.groq || data.apiKeys?.usda || data.apiKeys?.pexels) {
            try {
              await fetch("http://localhost:3001/api/server-keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  groq: data.apiKeys.groq || "",
                  usda: data.apiKeys.usda || "",
                  pexels: data.apiKeys.pexels || "",
                }),
              });
            } catch {}
          }

          const recipeCount = data.recipes?.length || 0;
          const bookCount = data.cookbooks?.length || 0;
          setSyncStatus(`Import erfolgreich! ${recipeCount} Rezepte, ${bookCount} Kategorien, alle API Keys übernommen.`);
        } catch (err) {
          setSyncStatus("Import fehlgeschlagen – ungültige Datei.");
        }
      };
      input.click();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* API Key */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Claude API Key</Text>
        <Text style={styles.cardDesc}>
          Du brauchst einen Anthropic API Key, um Rezepte zu generieren. Hol dir
          einen auf console.anthropic.com.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="sk-ant-..."
          placeholderTextColor="#aaa"
          value={key}
          onChangeText={(text) => {
            setKey(text);
            setSaved(false);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              {saved ? "✓ Gespeichert" : "Speichern"}
            </Text>
          </TouchableOpacity>
          {saved && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Entfernen</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sync */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daten synchronisieren</Text>
        <Text style={styles.cardDesc}>
          Exportiere alle Rezepte, Kategorien und Einstellungen als Datei.
          Dein Partner kann diese Datei importieren um den gleichen Stand zu haben.
        </Text>

        {!syncUnlocked ? (
          <View>
            <TextInput
              style={styles.input}
              placeholder="Passwort eingeben..."
              placeholderTextColor="#aaa"
              value={syncPassword}
              onChangeText={setSyncPassword}
              secureTextEntry
              onSubmitEditing={() => {
                if (syncPassword === "2026") setSyncUnlocked(true);
                else setSyncStatus("Falsches Passwort.");
              }}
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => {
                if (syncPassword === "2026") setSyncUnlocked(true);
                else setSyncStatus("Falsches Passwort.");
              }}
            >
              <Text style={styles.saveButtonText}>Entsperren</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
                <Text style={styles.exportButtonText}>Exportieren</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.importButton} onPress={handleImport}>
                <Text style={styles.importButtonText}>Importieren</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Text style={styles.shareButtonText}>Teilen</Text>
            </TouchableOpacity>
          </View>
        )}

        {syncStatus ? (
          <Text style={styles.syncStatus}>{syncStatus}</Text>
        ) : null}
      </View>

      {/* Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>So funktioniert's</Text>
        <Text style={styles.infoText}>
          1. Kopiere einen TikTok oder Instagram Link{"\n"}
          2. Füge ihn auf dem "Neues Rezept" Tab ein{"\n"}
          3. Die App erstellt automatisch ein Rezept{"\n"}
          4. Speichere deine Lieblingsrezepte
        </Text>
      </View>

      <Text style={styles.version}>Rezept App v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F0" },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 8 },
  cardDesc: { fontSize: 13, color: "#777", marginBottom: 16, lineHeight: 18 },
  input: {
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 12,
  },
  buttonRow: { flexDirection: "row", gap: 10 },
  saveButton: {
    backgroundColor: "#FF6B35",
    borderRadius: 10,
    padding: 14,
    flex: 1,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  clearButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 14,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  clearButtonText: { color: "#999", fontWeight: "600", fontSize: 15 },
  exportButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    padding: 14,
    flex: 1,
    alignItems: "center",
  },
  exportButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  importButton: {
    backgroundColor: "#1E88E5",
    borderRadius: 10,
    padding: 14,
    flex: 1,
    alignItems: "center",
  },
  importButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  shareButton: {
    backgroundColor: "#FF6B35",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
  },
  shareButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  syncStatus: {
    marginTop: 12,
    fontSize: 13,
    color: "#4CAF50",
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 12 },
  infoText: { fontSize: 14, color: "#666", lineHeight: 24 },
  version: {
    textAlign: "center",
    color: "#ccc",
    fontSize: 12,
    marginTop: 8,
  },
});
