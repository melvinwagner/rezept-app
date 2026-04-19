import { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { reportBug, BugCategory } from "../services/api";

const CATEGORIES: BugCategory[] = ["Bug", "Feedback", "Idee"];

export default function BugReportButton() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<BugCategory>("Bug");
  const [text, setText] = useState("");
  const [username, setUsername] = useState("Tester");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<null | "ok" | "err">(null);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    if (!open) return;
    AsyncStorage.getItem("user_name").then((v) => {
      if (v && v.trim()) setUsername(v.trim());
    });
    setText("");
    setCategory("Bug");
    setStatus(null);
    setErrMsg("");
  }, [open]);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await reportBug(username, category, trimmed);
      setStatus("ok");
      setTimeout(() => setOpen(false), 1200);
    } catch (e: any) {
      setStatus("err");
      setErrMsg(e?.message || "Konnte nicht gesendet werden.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Pressable
        style={styles.fab}
        onPress={() => setOpen(true)}
        hitSlop={10}
        accessibilityLabel="Bug melden oder Feedback geben"
      >
        <Text style={styles.fabText}>?</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.overlay}
        >
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={styles.card}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.handle} />
              <Text style={styles.title}>Feedback & Bug-Report</Text>
              <Text style={styles.subtitle}>
                Hilf uns, die App besser zu machen. Dein Feedback geht direkt ans Team.
              </Text>

              <Text style={styles.sectionLabel}>Kategorie</Text>
              <View style={styles.chipRow}>
                {CATEGORIES.map((c) => {
                  const active = c === category;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => setCategory(c)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && { color: "#fff" }]}>
                        {c}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.sectionLabel}>Beschreibung</Text>
              <TextInput
                style={styles.input}
                value={text}
                onChangeText={setText}
                placeholder="Was ist passiert? Was wünschst du dir?"
                placeholderTextColor="#A8B8A2"
                multiline
                numberOfLines={6}
                maxLength={2000}
              />
              <Text style={styles.counter}>{text.length} / 2000</Text>

              <Text style={styles.asUser}>
                Gesendet als: <Text style={{ fontWeight: "700" }}>{username}</Text>
              </Text>

              {status === "err" && (
                <Text style={styles.err}>{errMsg}</Text>
              )}
              {status === "ok" && (
                <Text style={styles.ok}>Danke! Dein Feedback ist angekommen.</Text>
              )}

              <Pressable
                style={[styles.submitBtn, (!text.trim() || submitting) && styles.submitBtnDisabled]}
                onPress={submit}
                disabled={!text.trim() || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Senden</Text>
                )}
              </Pressable>
              <Pressable style={styles.cancelBtn} onPress={() => setOpen(false)}>
                <Text style={styles.cancelBtnText}>Abbrechen</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    top: Platform.OS === "ios" ? 58 : 28,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "rgba(42,56,37,0.12)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)" as any,
    zIndex: 9999,
    elevation: 9,
  } as any,
  fabText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#5A9A4E",
    lineHeight: 20,
  },

  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  card: {
    backgroundColor: "#F4F7F0",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingTop: 10,
    paddingBottom: 40,
    maxHeight: "92%" as any,
  } as any,
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(42,56,37,0.15)",
    alignSelf: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2A3825",
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: "#5E6E55",
    marginTop: 6,
    marginBottom: 4,
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#8A9E82",
    marginTop: 18,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  chipRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" } as any,
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.9)",
  },
  chipActive: { backgroundColor: "#2A3825", borderColor: "#2A3825" },
  chipText: { fontSize: 12, fontWeight: "700", color: "#2A3825", letterSpacing: 0.2 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    fontSize: 15,
    color: "#2A3825",
    borderWidth: 0.5,
    borderColor: "rgba(42,56,37,0.12)",
    minHeight: 120,
    textAlignVertical: "top",
  },
  counter: {
    fontSize: 11,
    color: "#A8B8A2",
    marginTop: 4,
    textAlign: "right",
  },
  asUser: {
    fontSize: 12,
    color: "#5E6E55",
    marginTop: 14,
  },
  err: {
    fontSize: 13,
    color: "#B4472E",
    marginTop: 12,
    fontWeight: "600",
  },
  ok: {
    fontSize: 13,
    color: "#5A9A4E",
    marginTop: 12,
    fontWeight: "700",
  },
  submitBtn: {
    marginTop: 18,
    backgroundColor: "rgba(42,56,37,0.97)",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.3 },
  cancelBtn: { paddingVertical: 12, alignItems: "center" },
  cancelBtnText: { color: "#8A9E82", fontSize: 13, fontWeight: "600" },
});
