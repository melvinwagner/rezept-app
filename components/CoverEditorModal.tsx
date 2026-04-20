import { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Cover, COVER_LAYOUTS, COVER_PALETTE, CoverLayoutId } from "./Cover";

type SaveValues = {
  name: string;
  tagline: string;
  edition: string;
  layoutId: CoverLayoutId;
  colorIdx: number;
};

export default function CoverEditorModal({
  visible,
  onClose,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved?: (values: SaveValues) => void;
}) {
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("Ein Archiv in Bewegung");
  const [edition, setEdition] = useState("Edition 2026");
  const [layoutId, setLayoutId] = useState<CoverLayoutId>("classic");
  const [colorIdx, setColorIdx] = useState(0);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const entries = await AsyncStorage.multiGet([
        "user_name",
        "cover_tagline",
        "cover_edition",
        "cover_layout_id",
        "cover_color_idx",
      ]);
      for (const [k, v] of entries) {
        if (!v) continue;
        if (k === "user_name") setName(v);
        if (k === "cover_tagline") setTagline(v);
        if (k === "cover_edition") setEdition(v);
        if (k === "cover_layout_id" && COVER_LAYOUTS.some((l) => l.id === v)) {
          setLayoutId(v as CoverLayoutId);
        }
        if (k === "cover_color_idx") {
          const i = parseInt(v, 10);
          if (!Number.isNaN(i) && i >= 0 && i < COVER_PALETTE.length) {
            setColorIdx(i);
          }
        }
      }
    })();
  }, [visible]);

  const save = async () => {
    const finalName = name.trim() || "Tester";
    const finalTagline = tagline.trim() || "Ein Archiv in Bewegung";
    const finalEdition = edition.trim() || "Edition 2026";
    await AsyncStorage.multiSet([
      ["user_name", finalName],
      ["cover_tagline", finalTagline],
      ["cover_edition", finalEdition],
      ["cover_layout_id", layoutId],
      ["cover_color_idx", String(colorIdx)],
      ["editor_tip_seen", "true"],
    ]);
    onSaved?.({
      name: finalName,
      tagline: finalTagline,
      edition: finalEdition,
      layoutId,
      colorIdx,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.handle} />

            <Text style={styles.title}>Cover bearbeiten</Text>

            <View style={styles.previewWrap}>
              <Cover
                layout={layoutId}
                gradient={COVER_PALETTE[colorIdx].grad}
                name={name || "Tester"}
                tagline={tagline}
                edition={edition}
              />
            </View>

            <Text style={styles.sectionLabel}>Layout</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {COVER_LAYOUTS.map((l) => {
                const active = l.id === layoutId;
                return (
                  <Pressable
                    key={l.id}
                    onPress={() => setLayoutId(l.id)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && { color: "#fff" }]}>
                      {l.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.sectionLabel}>Farbe</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {COVER_PALETTE.map((p, i) => {
                const active = i === colorIdx;
                return (
                  <Pressable key={i} onPress={() => setColorIdx(i)}>
                    <LinearGradient
                      colors={p.grad}
                      start={{ x: 0.1, y: 0 }}
                      end={{ x: 0.8, y: 1 }}
                      style={[styles.swatch, active && styles.swatchActive]}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.sectionLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Dein Name"
              placeholderTextColor="#A8B8A2"
              autoCapitalize="words"
            />

            <Text style={styles.sectionLabel}>Tagline</Text>
            <TextInput
              style={styles.input}
              value={tagline}
              onChangeText={setTagline}
              placeholder="Ein Archiv in Bewegung"
              placeholderTextColor="#A8B8A2"
            />

            <Text style={styles.sectionLabel}>Edition</Text>
            <TextInput
              style={styles.input}
              value={edition}
              onChangeText={setEdition}
              placeholder="Edition 2026"
              placeholderTextColor="#A8B8A2"
            />

            <Pressable style={styles.saveBtn} onPress={save}>
              <Text style={styles.saveBtnText}>Speichern</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Abbrechen</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  card: {
    backgroundColor: "#F4F7F0",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingTop: 10,
    paddingBottom: 40,
    maxHeight: "94%" as any,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(42,56,37,0.15)",
    alignSelf: "center" as any,
    marginBottom: 14,
  },
  title: {
    fontFamily: "FrankRuhlLibre_900Black",
    fontSize: 26,
    color: "#2A3825",
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 14,
  },
  previewWrap: { alignItems: "center" as any, marginVertical: 12 } as any,

  sectionLabel: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 10,
    letterSpacing: 1.8,
    color: "#8A9E82",
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase" as any,
  },
  chipRow: { gap: 6, paddingRight: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#FAFCF6",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.9)",
  },
  chipActive: { backgroundColor: "#2A3825", borderColor: "#2A3825" },
  chipText: { fontFamily: "Manrope_700Bold", fontSize: 12, color: "#2A3825", letterSpacing: 0.3 },
  swatch: { width: 34, height: 34, borderRadius: 10 },
  swatchActive: { borderWidth: 2, borderColor: "#2A3825" },

  input: {
    backgroundColor: "#FAFCF6",
    borderRadius: 14,
    padding: 12,
    fontSize: 15,
    color: "#2A3825",
    borderWidth: 0.5,
    borderColor: "rgba(42,56,37,0.12)",
  },

  saveBtn: {
    marginTop: 22,
    backgroundColor: "rgba(42,56,37,0.97)",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center" as any,
  } as any,
  saveBtnText: { fontFamily: "Manrope_700Bold", color: "#fff", fontSize: 15, letterSpacing: 0.3 },
  cancelBtn: { paddingVertical: 12, alignItems: "center" as any } as any,
  cancelBtnText: { fontFamily: "Manrope_600SemiBold", color: "#8A9E82", fontSize: 13 },
});
