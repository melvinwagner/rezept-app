import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  Image,
  ScrollView,
  StyleSheet,
  PanResponder,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Recipe, ImageTransform } from "../types/recipe";
import { saveRecipe, updateRecipe, getCookbooks, addCookbook } from "../services/storage";

const PICKER_TAGS = [
  "Vegan", "Vegetarisch", "Schnell", "Gesund", "Italienisch",
  "Asiatisch", "Desserts", "Frühstück", "Grillen", "Meal Prep",
];

const DEFAULT_COOKBOOK = "Meine Rezepte";
const DEFAULT_TRANSFORM: ImageTransform = { scale: 1, translateX: 0, translateY: 0 };

interface Props {
  visible: boolean;
  recipe: Recipe;
  mode: "new" | "edit";
  onClose: () => void;
  onSaved?: (saved: Recipe) => void;
}

export default function RecipeSaveModal({ visible, recipe, mode, onClose, onSaved }: Props) {
  const [cookbooks, setCookbooks] = useState<string[]>([]);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [editedNotes, setEditedNotes] = useState("");
  const [selectedCookbook, setSelectedCookbook] = useState<string>(DEFAULT_COOKBOOK);
  const [editedImageUri, setEditedImageUri] = useState<string | undefined>(undefined);
  const [imageTransform, setImageTransform] = useState<ImageTransform>(DEFAULT_TRANSFORM);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const books = await getCookbooks();
      if (!books.includes(DEFAULT_COOKBOOK)) {
        await addCookbook(DEFAULT_COOKBOOK);
        books.unshift(DEFAULT_COOKBOOK);
      }
      setCookbooks(books);
    })();
    setEditedTitle(recipe.title);
    setEditedTags(recipe.tags ?? []);
    setCustomTag("");
    setEditedNotes(recipe.notes ?? "");
    setSelectedCookbook(recipe.cookbook ?? DEFAULT_COOKBOOK);
    setEditedImageUri(recipe.imageUrl ?? recipe.thumbnail);
    setImageTransform(recipe.imageTransform ?? DEFAULT_TRANSFORM);
    setError("");
  }, [visible, recipe]);

  const toggleTag = (tag: string) => {
    setEditedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const t = customTag.trim();
    if (t && !editedTags.includes(t)) {
      setEditedTags([...editedTags, t]);
    }
    setCustomTag("");
  };

  const handlePickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError("Kein Zugriff auf die Galerie.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setEditedImageUri(result.assets[0].uri);
      setImageTransform(DEFAULT_TRANSFORM);
    }
  };

  const resetImageTransform = () => setImageTransform(DEFAULT_TRANSFORM);

  const adjustScale = (delta: number) => {
    setImageTransform((prev) => {
      const next = Math.max(0.5, Math.min(3, prev.scale + delta));
      return { ...prev, scale: next };
    });
  };

  const gestureStart = useRef({ x: 0, y: 0 });
  const transformRef = useRef(imageTransform);
  transformRef.current = imageTransform;

  const imagePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        gestureStart.current.x = transformRef.current.translateX;
        gestureStart.current.y = transformRef.current.translateY;
      },
      onPanResponderMove: (_, g) => {
        setImageTransform({
          scale: transformRef.current.scale,
          translateX: gestureStart.current.x + g.dx,
          translateY: gestureStart.current.y + g.dy,
        });
      },
    })
  ).current;

  const doSave = async () => {
    setError("");
    try {
      const finalTitle = editedTitle.trim() || recipe.title;
      const updated: Recipe = {
        ...recipe,
        title: finalTitle,
        cookbook: selectedCookbook,
        tags: editedTags,
        notes: editedNotes.trim() || undefined,
        imageUrl: editedImageUri ?? recipe.imageUrl,
        imageTransform,
      };
      if (mode === "new") {
        await saveRecipe(updated);
      } else {
        await updateRecipe(updated);
      }
      onSaved?.(updated);
      onClose();
    } catch {
      setError("Rezept konnte nicht gespeichert werden.");
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <Pressable style={styles.modalOverlay} onPress={onClose}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.modalHandle} />

              <View style={styles.thumbWrap}>
                <View style={styles.thumbFrame}>
                  {editedImageUri ? (
                    <Image
                      source={{ uri: editedImageUri }}
                      style={[
                        styles.thumbImg,
                        {
                          transform: [
                            { translateX: imageTransform.translateX },
                            { translateY: imageTransform.translateY },
                            { scale: imageTransform.scale },
                          ],
                        },
                      ]}
                    />
                  ) : (
                    <View style={[styles.thumbImg, styles.thumbPlaceholder]} />
                  )}
                  <Pressable style={styles.thumbEditBtn} onPress={() => setShowImageEditor(true)}>
                    <Text style={styles.thumbEditBtnText}>Bearbeiten</Text>
                  </Pressable>
                </View>
              </View>

              <Text style={styles.modalTitle}>
                {mode === "new" ? "Rezept speichern" : "Rezept bearbeiten"}
              </Text>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Text style={styles.modalSectionTitle}>Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editedTitle}
                onChangeText={setEditedTitle}
                placeholder="Rezept-Name"
                placeholderTextColor="#A8B8A2"
              />

              <Text style={styles.modalSectionTitle}>Kochbuch</Text>
              {cookbooks.map((name) => (
                <Pressable
                  key={name}
                  style={[styles.cookbookRow, selectedCookbook === name && styles.cookbookRowActive]}
                  onPress={() => setSelectedCookbook(name)}
                >
                  <View style={[styles.radioDot, selectedCookbook === name && styles.radioDotActive]}>
                    {selectedCookbook === name && <View style={styles.radioDotInner} />}
                  </View>
                  <Text style={[styles.cookbookRowText, selectedCookbook === name && styles.cookbookRowTextActive]}>
                    {name}
                  </Text>
                </Pressable>
              ))}

              <Text style={styles.modalSectionTitle}>Tags</Text>
              <View style={styles.customTagRow}>
                <TextInput
                  style={styles.customTagInput}
                  value={customTag}
                  onChangeText={setCustomTag}
                  placeholder="Eigenen Tag eingeben..."
                  placeholderTextColor="#A8B8A2"
                  onSubmitEditing={addCustomTag}
                />
                <Pressable style={styles.customTagBtn} onPress={addCustomTag}>
                  <Text style={styles.customTagBtnText}>+</Text>
                </Pressable>
              </View>
              {editedTags.filter((t) => !PICKER_TAGS.includes(t)).length > 0 && (
                <View style={[styles.tagGrid, { marginBottom: 8 }]}>
                  {editedTags
                    .filter((t) => !PICKER_TAGS.includes(t))
                    .map((t) => (
                      <Pressable key={t} style={[styles.tagChip, styles.tagChipActive]} onPress={() => toggleTag(t)}>
                        <Text style={[styles.tagChipText, styles.tagChipTextActive]}>{t} ✕</Text>
                      </Pressable>
                    ))}
                </View>
              )}
              <View style={styles.tagGrid}>
                {PICKER_TAGS.map((t) => (
                  <Pressable
                    key={t}
                    style={[styles.tagChip, editedTags.includes(t) && styles.tagChipActive]}
                    onPress={() => toggleTag(t)}
                  >
                    <Text style={[styles.tagChipText, editedTags.includes(t) && styles.tagChipTextActive]}>{t}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.modalSectionTitle}>Notizen</Text>
              <TextInput
                style={[styles.modalInput, styles.notesInput]}
                value={editedNotes}
                onChangeText={setEditedNotes}
                placeholder="Persönliche Notiz (optional)"
                placeholderTextColor="#A8B8A2"
                multiline
                numberOfLines={3}
              />

              <Pressable
                style={[styles.modalCreateBtn, !editedTitle.trim() && { opacity: 0.4 }]}
                onPress={doSave}
                disabled={!editedTitle.trim()}
              >
                <Text style={styles.modalCreateBtnText}>
                  {mode === "new" ? "Rezept speichern" : "Änderungen speichern"}
                </Text>
              </Pressable>
              <Pressable style={styles.modalCancelBtn} onPress={onClose}>
                <Text style={styles.modalCancelBtnText}>Abbrechen</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showImageEditor} transparent animationType="slide" onRequestClose={() => setShowImageEditor(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowImageEditor(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Bild ausrichten</Text>
            <Text style={styles.editorHint}>Bild ziehen zum Verschieben · Zoom über Buttons</Text>

            <View style={styles.editorFrame} {...imagePan.panHandlers}>
              {editedImageUri ? (
                <Image
                  source={{ uri: editedImageUri }}
                  style={[
                    styles.editorImg,
                    {
                      transform: [
                        { translateX: imageTransform.translateX },
                        { translateY: imageTransform.translateY },
                        { scale: imageTransform.scale },
                      ],
                    },
                  ]}
                />
              ) : (
                <View style={[styles.editorImg, styles.thumbPlaceholder]} />
              )}
            </View>

            <View style={styles.zoomRow}>
              <Pressable style={styles.zoomBtn} onPress={() => adjustScale(-0.1)}>
                <Text style={styles.zoomBtnText}>−</Text>
              </Pressable>
              <Text style={styles.zoomLabel}>{Math.round(imageTransform.scale * 100)} %</Text>
              <Pressable style={styles.zoomBtn} onPress={() => adjustScale(0.1)}>
                <Text style={styles.zoomBtnText}>+</Text>
              </Pressable>
            </View>

            <Pressable style={styles.editorSecondaryBtn} onPress={handlePickImage}>
              <Text style={styles.editorSecondaryBtnText}>Bild aus Galerie wählen</Text>
            </Pressable>
            <Pressable style={styles.editorSecondaryBtn} onPress={resetImageTransform}>
              <Text style={styles.editorSecondaryBtnText}>Zurücksetzen</Text>
            </Pressable>
            <Pressable style={styles.modalCreateBtn} onPress={() => setShowImageEditor(false)}>
              <Text style={styles.modalCreateBtnText}>Fertig</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const G = "rgba(42, 56, 37, 0.55)";
const W = (a: number) => `rgba(255,255,255,${a})`;

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: "#F4F7F0", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingTop: 14, paddingBottom: 40, maxHeight: "92%" as any,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(42,56,37,0.15)",
    alignSelf: "center", marginBottom: 16,
  },
  modalTitle: { fontSize: 22, fontWeight: "800", color: "#2A3825", letterSpacing: -0.5, marginBottom: 18, marginTop: 4 },
  modalSectionTitle: {
    fontSize: 13, fontWeight: "700", color: "#5A7A52", letterSpacing: 0.3,
    textTransform: "uppercase" as any, marginBottom: 10, marginTop: 10,
  },
  modalInput: {
    backgroundColor: W(0.5), borderRadius: 16, padding: 16, fontSize: 16, fontWeight: "600",
    color: "#2A3825", borderWidth: 0.5, borderColor: W(0.9), marginBottom: 12,
  },
  notesInput: { minHeight: 88, textAlignVertical: "top" as any, fontWeight: "500" as any, fontSize: 14 },
  modalCreateBtn: {
    backgroundColor: G, borderRadius: 16, padding: 16, alignItems: "center",
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)",
    boxShadow: "0 4px 16px rgba(42,56,37,0.2)", marginTop: 18, marginBottom: 8,
  } as any,
  modalCreateBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  modalCancelBtn: { borderRadius: 16, padding: 14, alignItems: "center" },
  modalCancelBtnText: { color: "#8A9E82", fontSize: 14, fontWeight: "600" },

  errorBox: {
    backgroundColor: "rgba(155,68,68,0.07)", borderRadius: 14, padding: 12, marginBottom: 12,
    borderWidth: 0.5, borderColor: "rgba(155,68,68,0.12)",
  },
  errorText: { color: "#9B4444", fontSize: 13 },

  thumbWrap: { alignItems: "center", marginBottom: 16, marginTop: 4 },
  thumbFrame: {
    width: 200, height: 240, borderRadius: 18, overflow: "hidden" as any,
    backgroundColor: "rgba(42,56,37,0.08)", position: "relative" as any,
    boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
  } as any,
  thumbImg: { width: "100%" as any, height: "100%" as any, resizeMode: "cover" as any } as any,
  thumbPlaceholder: { backgroundColor: "rgba(42,56,37,0.15)" },
  thumbEditBtn: {
    position: "absolute" as any, bottom: 8, right: 8,
    backgroundColor: "rgba(42,56,37,0.85)", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.15)",
  },
  thumbEditBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  cookbookRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: W(0.5), borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 0.5, borderColor: W(0.7),
  },
  cookbookRowActive: {
    backgroundColor: "rgba(122,170,110,0.15)", borderColor: "#7BAA6E",
  },
  cookbookRowText: { fontSize: 14, color: "#2A3825", fontWeight: "500" },
  cookbookRowTextActive: { fontWeight: "700" },
  radioDot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: "rgba(42,56,37,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  radioDotActive: { borderColor: "#5A9A4E" },
  radioDotInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#5A9A4E" },

  customTagRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  customTagInput: {
    flex: 1, backgroundColor: W(0.6), borderRadius: 14, padding: 10, fontSize: 13,
    borderWidth: 0.5, borderColor: W(0.8),
  },
  customTagBtn: {
    width: 40, backgroundColor: G, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)",
  },
  customTagBtnText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  tagGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  tagChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: W(0.5), borderWidth: 0.5, borderColor: W(0.5),
  },
  tagChipActive: { backgroundColor: G, borderColor: "rgba(255,255,255,0.08)" },
  tagChipText: { fontSize: 13, fontWeight: "600", color: "#5A7A52" },
  tagChipTextActive: { color: "#fff" },

  editorHint: { fontSize: 12, color: "#8A9E82", marginBottom: 14, marginTop: -10 },
  editorFrame: {
    alignSelf: "center", width: 260, height: 300, borderRadius: 18,
    overflow: "hidden" as any, backgroundColor: "rgba(42,56,37,0.08)", marginBottom: 16,
  } as any,
  editorImg: { width: "100%" as any, height: "100%" as any, resizeMode: "cover" as any } as any,
  zoomRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 14 },
  zoomBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: W(0.6),
    alignItems: "center", justifyContent: "center",
    borderWidth: 0.5, borderColor: W(0.8),
  },
  zoomBtnText: { fontSize: 22, fontWeight: "700", color: "#2A3825", lineHeight: 24 },
  zoomLabel: { fontSize: 14, fontWeight: "700", color: "#2A3825", minWidth: 60, textAlign: "center" as any },
  editorSecondaryBtn: {
    backgroundColor: W(0.5), borderRadius: 14, padding: 12, alignItems: "center",
    borderWidth: 0.5, borderColor: W(0.8), marginBottom: 8,
  },
  editorSecondaryBtnText: { color: "#2A3825", fontSize: 13, fontWeight: "700" },
});
