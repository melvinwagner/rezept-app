import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setApiKey, getApiKey } from "../../services/api";

const API_KEY_STORAGE = "claude_api_key";

export default function SettingsScreen() {
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);

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
    if (!trimmed) {
      Alert.alert("Fehler", "Bitte gib einen API Key ein.");
      return;
    }
    await AsyncStorage.setItem(API_KEY_STORAGE, trimmed);
    setApiKey(trimmed);
    setSaved(true);
    Alert.alert("Gespeichert!", "Dein API Key wurde gespeichert.");
  };

  const handleClear = async () => {
    await AsyncStorage.removeItem(API_KEY_STORAGE);
    setKey("");
    setApiKey("");
    setSaved(false);
  };

  return (
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F0", padding: 16 },
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
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
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
    marginTop: 24,
  },
});
