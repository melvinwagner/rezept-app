import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
  FlatList,
  Image,
  Modal,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { getRecipes, deleteRecipe, getCookbooks, addCookbook, deleteCookbook, updateRecipe, getCookbookMeta, saveCookbookMeta, renameCookbookMeta, CookbookMeta } from "../../services/storage";
import { Recipe } from "../../types/recipe";

const CARD_COLORS = [
  ["#6B8B68", "#1E2E1A"],  // Waldgrün
  ["#8AAA7A", "#2A3E22"],  // Salbei
  ["#A0B488", "#3A5230"],  // Olive
  ["#7A9A8A", "#1E3428"],  // Eukalyptus
  ["#8EAE7E", "#2A4220"],  // Matcha
  ["#80A090", "#243828"],  // Moos
  ["#9EAE8E", "#343E28"],  // Thymian
  ["#7AAA8E", "#1A3424"],  // Jade
  ["#96A87A", "#2A3618"],  // Pistazie
  ["#84967A", "#1E2C16"],  // Basilikum
];

const CARD_SUBTITLES: Record<string, string> = {
  "Meine Rezepte": "Alle Lieblingsrezepte",
  "Italienisch": "Pasta, Pizza & mehr",
  "Asiatisch": "Reis, Sushi & Co.",
  "Frühstück": "Für den perfekten Start",
  "Healthy": "Leicht & nährstoffreich",
  "Desserts": "Süße Verführung",
  "Schnelle Küche": "Unter 30 Minuten",
  "Vegetarisch": "Ohne Fleisch",
  "Grillen": "BBQ & Outdoor",
  "Meal Prep": "Für die Woche",
  "Backen": "Brot & Gebäck",
  "Fisch": "Lachs & mehr",
  "Pasta & Co.": "Nudelgerichte",
  "Test": "Zum Ausprobieren",
};

const PICKER_COLORS = [
  ["#6B8B68", "#1E2E1A"],  // Waldgrün
  ["#8AAA7A", "#2A3E22"],  // Salbei
  ["#A09078", "#3A2818"],  // Terrakotta
  ["#9A8A72", "#2E2418"],  // Mokka
  ["#8890A0", "#282E3A"],  // Schieferblau
  ["#A08A8A", "#382828"],  // Rosewood
  ["#90987A", "#2A2E1A"],  // Olive
  ["#7A8A98", "#1E2830"],  // Ozean
  ["#A09A80", "#303018"],  // Sand
  ["#9A8898", "#2E2430"],  // Lavendel
  ["#88A090", "#1E3028"],  // Jade
  ["#B09070", "#3A2010"],  // Karamell
  ["#7898A8", "#1A2A38"],  // Nordlicht
  ["#A8887A", "#302018"],  // Zimt
];

const COVER_ICONS = [
  require("../../assets/covers/dawg.png"),
  require("../../assets/covers/pasta.png"),
  require("../../assets/covers/salad.png"),
  require("../../assets/covers/sushi.png"),
  require("../../assets/covers/cake.png"),
  require("../../assets/covers/avocado.png"),
  require("../../assets/covers/pizza.png"),
  require("../../assets/covers/noodles.png"),
  require("../../assets/covers/curry.png"),
  require("../../assets/covers/tacos.png"),
  require("../../assets/covers/burger.png"),
  require("../../assets/covers/croissant.png"),
  require("../../assets/covers/egg.png"),
  require("../../assets/covers/steak.png"),
  require("../../assets/covers/fish.png"),
  require("../../assets/covers/smoothie.png"),
  require("../../assets/covers/bread.png"),
  require("../../assets/covers/icecream.png"),
  require("../../assets/covers/soup.png"),
  require("../../assets/covers/wine.png"),
  require("../../assets/covers/hotpot.png"),
];

const EMOJI_BG_COLORS = [
  null,                       // Ohne Farbe
  "rgba(255,234,167,0.5)",   // Butter
  "rgba(250,212,212,0.5)",   // Rosa
  "rgba(212,232,250,0.5)",   // Himmelblau
  "rgba(223,230,218,0.5)",   // Salbei
  "rgba(232,218,244,0.5)",   // Lavendel
  "rgba(255,224,204,0.5)",   // Pfirsich
  "rgba(212,240,232,0.5)",   // Mint
  "rgba(245,230,204,0.5)",   // Sand
  "rgba(224,232,240,0.5)",   // Silberblau
  "rgba(240,224,232,0.5)",   // Mauve
  "rgba(232,240,212,0.5)",   // Limette
  "rgba(240,232,212,0.5)",   // Vanille
  "rgba(212,224,232,0.5)",   // Eisblau
];

const PICKER_TAGS = [
  "Vegan", "Vegetarisch", "Schnell", "Gesund", "Italienisch",
  "Asiatisch", "Desserts", "Frühstück", "Grillen", "Meal Prep",
];

const FEATURED_BOOKS = [
  { name: "Pasta Classics", sub: "Von @pastagrannies", color: 3, icon: 1, emojiBg: 1 },
  { name: "Sushi Guide", sub: "Von @sushimaster", color: 7, icon: 3, emojiBg: 4 },
  { name: "Burger Vibes", sub: "Von @burgerboys", color: 4, icon: 10, emojiBg: 6 },
  { name: "Healthy Bowls", sub: "Von @eatclean", color: 0, icon: 2, emojiBg: 7 },
  { name: "Pizza Night", sub: "Von @pizzalovers", color: 2, icon: 6, emojiBg: 3 },
  { name: "Dessert Dreams", sub: "Von @sweetbaker", color: 10, icon: 4, emojiBg: 2 },
  { name: "Asian Kitchen", sub: "Von @woklove", color: 8, icon: 7, emojiBg: 5 },
  { name: "Frühstück", sub: "Von @morningfuel", color: 9, icon: 12, emojiBg: 1 },
];

export default function SavedScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [cookbooks, setCookbooks] = useState<string[]>([]);
  const [meta, setMeta] = useState<Record<string, CookbookMeta>>({});
  const [selectedCookbook, setSelectedCookbook] = useState<string | null>(null);
  const [newCookbookName, setNewCookbookName] = useState("");
  const [showNewInput, setShowNewInput] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedEmojiBg, setSelectedEmojiBg] = useState(0);
  const [selectedEmoji, setSelectedEmoji] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editingCookbook, setEditingCookbook] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const [r, c, m] = await Promise.all([getRecipes(), getCookbooks(), getCookbookMeta()]);
    setRecipes(r);
    if (!c.includes("Meine Rezepte")) {
      c.unshift("Meine Rezepte");
      await addCookbook("Meine Rezepte");
    }
    setCookbooks(c);
    setMeta(m);
  };

  const handleDelete = async (recipe: Recipe) => {
    const confirmed = Platform.OS === "web"
      ? window.confirm(`"${recipe.title}" wirklich löschen?`)
      : await new Promise((resolve) =>
          Alert.alert("Löschen?", `"${recipe.title}" wirklich löschen?`, [
            { text: "Abbrechen", onPress: () => resolve(false) },
            { text: "Löschen", style: "destructive", onPress: () => resolve(true) },
          ])
        );
    if (confirmed) {
      await deleteRecipe(recipe.id);
      loadData();
    }
  };

  const handleDeleteCookbook = async (name: string) => {
    if (name === "Meine Rezepte") return;
    const confirmed = Platform.OS === "web"
      ? window.confirm(`"${name}" löschen? Die Rezepte werden zu "Meine Rezepte" verschoben.`)
      : await new Promise((resolve) =>
          Alert.alert("Kategorie löschen?", `"${name}" löschen?`, [
            { text: "Abbrechen", onPress: () => resolve(false) },
            { text: "Löschen", style: "destructive", onPress: () => resolve(true) },
          ])
        );
    if (confirmed) {
      await deleteCookbook(name);
      setSelectedCookbook(null);
      loadData();
    }
  };

  const handleCreateCookbook = async () => {
    const name = newCookbookName.trim();
    if (!name) return;
    await addCookbook(name);
    await saveCookbookMeta(name, {
      colorIndex: selectedColor,
      emojiBgIndex: selectedEmojiBg,
      emojiIndex: selectedEmoji,
      tags: selectedTags,
    });
    setNewCookbookName("");
    setShowNewInput(false);
    setShowModal(false);
    setSelectedColor(0);
    setSelectedEmoji(0);
    setSelectedEmojiBg(0);
    setSelectedTags([]);
    setCustomTag("");
    loadData();
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const t = customTag.trim();
    if (t && !selectedTags.includes(t)) {
      setSelectedTags([...selectedTags, t]);
    }
    setCustomTag("");
  };

  const openModal = () => {
    setNewCookbookName("");
    setSelectedColor(0);
    setSelectedEmojiBg(0);
    setSelectedEmoji(0);
    setSelectedTags([]);
    setCustomTag("");
    setEditingCookbook(null);
    setShowModal(true);
  };

  const openEditModal = (name: string) => {
    setNewCookbookName(name);
    const m = meta[name];
    if (m) {
      setSelectedColor(m.colorIndex);
      setSelectedEmojiBg(m.emojiBgIndex);
      setSelectedEmoji(m.emojiIndex);
      setSelectedTags(m.tags || []);
    } else {
      const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      setSelectedColor(hash % PICKER_COLORS.length);
      setSelectedEmojiBg(0);
      setSelectedEmoji(0);
      setSelectedTags([]);
    }
    setCustomTag("");
    setEditingCookbook(name);
    setMenuOpen(null);
    setShowModal(true);
  };

  const handleSaveEdit = async () => {
    const newName = newCookbookName.trim();
    if (!newName || !editingCookbook) return;
    if (newName !== editingCookbook) {
      await addCookbook(newName);
      await renameCookbookMeta(editingCookbook, newName);
      const allRecipes = await getRecipes();
      for (const r of allRecipes) {
        if (r.cookbook === editingCookbook) {
          await updateRecipe({ ...r, cookbook: newName });
        }
      }
      await deleteCookbook(editingCookbook);
    }
    await saveCookbookMeta(newName, {
      colorIndex: selectedColor,
      emojiBgIndex: selectedEmojiBg,
      emojiIndex: selectedEmoji,
      tags: selectedTags,
    });
    setShowModal(false);
    setEditingCookbook(null);
    setNewCookbookName("");
    loadData();
  };

  const handleRate = (recipe: Recipe, rating: number) => {
    const updated = { ...recipe, rating };
    updateRecipe(updated);
    setRecipes(recipes.map((r) => r.id === recipe.id ? updated : r));
  };

  const renderStars = (recipe: Recipe) => {
    const current = recipe.rating || 0;
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable key={star} onPress={() => handleRate(recipe, star)}>
            <Text style={[styles.star, star <= current && styles.starActive]}>
              {star <= current ? "★" : "☆"}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  };

  const getRecipesForCookbook = (name: string) => {
    return recipes.filter((r) => r.cookbook === name || (!r.cookbook && name === "Meine Rezepte"));
  };

  const getImagesForCookbook = (name: string): string[] => {
    return getRecipesForCookbook(name)
      .map((r) => r.imageUrl || r.thumbnail)
      .filter((img): img is string => !!img)
      .slice(0, 4);
  };

  // ============ REZEPT-LISTE ============
  if (selectedCookbook) {
    const categoryRecipes = getRecipesForCookbook(selectedCookbook);
    return (
      <View style={styles.container}>
        <View style={styles.detailHeader}>
          <Pressable onPress={() => setSelectedCookbook(null)} style={styles.backButton}>
            <Text style={styles.backText}>‹ Kochbuch</Text>
          </Pressable>
          <Text style={styles.detailTitle}>{selectedCookbook}</Text>
          <Text style={styles.detailCount}>{categoryRecipes.length} {categoryRecipes.length === 1 ? "Rezept" : "Rezepte"}</Text>
        </View>
        <FlatList
          data={categoryRecipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.recipeList}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Text style={styles.emptyListEmoji}>📖</Text>
              <Text style={styles.emptyListText}>Keine Rezepte in dieser Kategorie</Text>
            </View>
          }
          renderItem={({ item }) => {
            const img = item.imageUrl || item.thumbnail;
            return (
              <View style={styles.recipeCard}>
                <Pressable style={styles.recipeCardMain} onPress={() => router.push(`/recipe/${item.id}`)}>
                  {img && <Image source={{ uri: img }} style={styles.recipeThumb} />}
                  <View style={styles.recipeCardBody}>
                    <Text style={styles.recipeTitle}>{item.title}</Text>
                    <Text style={styles.recipeDesc} numberOfLines={1}>{item.description}</Text>
                    <View style={styles.recipeMeta}>
                      <Text style={styles.recipeMetaText}>{item.servings} Portionen</Text>
                      <Text style={styles.recipeMetaDot}>·</Text>
                      <Text style={styles.recipeMetaText}>{item.cookTime}</Text>
                      {item.nutritionPerServing?.kcal ? (
                        <><Text style={styles.recipeMetaDot}>·</Text><Text style={styles.recipeMetaText}>{item.nutritionPerServing.kcal} kcal</Text></>
                      ) : null}
                    </View>
                    {renderStars(item)}
                  </View>
                </Pressable>
                <View style={styles.actionRow}>
                  <Pressable style={styles.actionButton} onPress={() => router.push(`/recipe/${item.id}`)}>
                    <Text style={styles.actionIcon}>✎</Text>
                    <Text style={styles.actionLabel}>Bearbeiten</Text>
                  </Pressable>
                  <Pressable style={styles.actionButton} onPress={() => {
                    if (item.sourceUrl) {
                      if (Platform.OS === "web") {
                        window.open(item.sourceUrl, "_blank");
                      }
                    }
                  }}>
                    <Text style={styles.actionIcon}>▶</Text>
                    <Text style={styles.actionLabel}>Original</Text>
                  </Pressable>
                  <Pressable style={[styles.actionButton, styles.actionButtonDanger]} onPress={() => handleDelete(item)}>
                    <Text style={[styles.actionIcon, styles.actionIconDanger]}>✕</Text>
                    <Text style={[styles.actionLabel, styles.actionLabelDanger]}>Löschen</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      </View>
    );
  }

  // ============ KATEGORIEN-ÜBERSICHT ============
  const filteredCookbooks = searchQuery
    ? cookbooks.filter((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))
    : cookbooks;

  const renderCard = (name: string, index: number) => {
    const count = getRecipesForCookbook(name).length;
    const m = meta[name];
    const colorIdx = m ? m.colorIndex : (name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % PICKER_COLORS.length);
    const color = PICKER_COLORS[colorIdx] || PICKER_COLORS[0];
    const emojiIdx = m ? m.emojiIndex : 0;
    const emojiBgIdx = m ? m.emojiBgIndex : 0;
    const subtitle = CARD_SUBTITLES[name] || "";

    return (
      <View key={name} style={styles.cardWrapper}>
        <Pressable
          onPress={() => { setSelectedCookbook(name); setSearchQuery(""); }}
          style={styles.magCard}
        >
          {/* Farbverlauf */}
          <LinearGradient
            colors={[color[0], color[1], color[1]]}
            locations={[0, 0.6, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.magGradient}
          />

          {/* Icon */}
          <View style={[styles.magIconCircle, { backgroundColor: EMOJI_BG_COLORS[emojiBgIdx] || "rgba(255,255,255,0.15)" }]}>
            <Image source={COVER_ICONS[emojiIdx]} style={styles.magIconImg} />
          </View>

          {/* Menü oben rechts */}
          <Pressable style={styles.magMenu} onPress={() => setMenuOpen(menuOpen === name ? null : name)}>
            <Text style={styles.magMenuDots}>···</Text>
          </Pressable>

          {/* Dropdown */}
          {menuOpen === name && (
            <View style={styles.menuDropdown}>
              <Pressable style={styles.menuDropdownItem} onPress={() => openEditModal(name)}>
                <Text style={styles.menuDropdownIcon}>✎</Text>
                <Text style={styles.menuDropdownText}>Bearbeiten</Text>
              </Pressable>
              {name !== "Meine Rezepte" && (
                <Pressable style={[styles.menuDropdownItem, styles.menuDropdownDanger]} onPress={() => { setMenuOpen(null); handleDeleteCookbook(name); }}>
                  <Text style={styles.menuDropdownIconDanger}>✕</Text>
                  <Text style={styles.menuDropdownTextDanger}>Löschen</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Content unten */}
          <View style={styles.magContent}>
            <Text style={styles.magCat}>Kategorie</Text>
            <Text style={styles.magName} numberOfLines={2}>{name}</Text>
            {subtitle ? <Text style={styles.magSub} numberOfLines={1}>{subtitle}</Text> : null}
            <Text style={styles.magCount}>{count} {count === 1 ? "Rezept" : "Rezepte"}</Text>
            <View style={styles.magLine} />
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <Pressable style={styles.container} onPress={() => setMenuOpen(null)}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Kochbücher suchen..."
            placeholderTextColor="#A8B8A2"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <Text style={styles.sectionLabel}>Meine Kochbücher</Text>
        <View style={styles.grid}>
          {filteredCookbooks.map((name, i) => renderCard(name, i))}
        </View>

        <Text style={styles.sectionLabel}>Weitere Kochbücher</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sliderContent}
          decelerationRate="fast"
          snapToInterval={168}
        >
          {[...FEATURED_BOOKS, ...FEATURED_BOOKS, ...FEATURED_BOOKS].map((book, i) => (
            <View key={i} style={styles.sliderCard}>
              <LinearGradient
                colors={[PICKER_COLORS[book.color][0], PICKER_COLORS[book.color][1]]}
                locations={[0, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.sliderGradient}
              />
              <View style={[styles.sliderIconCircle, { backgroundColor: EMOJI_BG_COLORS[book.emojiBg] || "rgba(255,255,255,0.15)" }]}>
                <Image source={COVER_ICONS[book.icon]} style={styles.sliderIconImg} />
              </View>
              <View style={styles.sliderInfo}>
                <Text style={styles.sliderName} numberOfLines={1}>{book.name}</Text>
                <Text style={styles.sliderSub}>{book.sub}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.addSection}>
          <Pressable style={styles.addButton} onPress={openModal}>
            <Text style={styles.addPlus}>+</Text>
            <Text style={styles.addText}>Neue Kategorie erstellen</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* === MODAL === */}
      <Modal visible={showModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHandle} />

              {/* === VORSCHAU === */}
              <View style={styles.previewWrap}>
                <View style={styles.previewCard}>
                  <LinearGradient
                    colors={[PICKER_COLORS[selectedColor][0], PICKER_COLORS[selectedColor][1]]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.previewGradient}
                  />
                  <View style={[
                    styles.previewEmojiCircle,
                    { backgroundColor: EMOJI_BG_COLORS[selectedEmojiBg] || "rgba(255,255,255,0.15)" }
                  ]}>
                    <Image source={COVER_ICONS[selectedEmoji]} style={styles.previewIconImg} />
                  </View>
                  <View style={styles.previewContent}>
                    <Text style={styles.previewCat}>Kategorie</Text>
                    <Text style={styles.previewName}>{newCookbookName || "Dein Kochbuch"}</Text>
                    <Text style={styles.previewCount}>0 Rezepte</Text>
                    <View style={styles.previewLine} />
                  </View>
                </View>
              </View>

              <Text style={styles.modalTitle}>{editingCookbook ? "Kochbuch bearbeiten" : "Neues Kochbuch"}</Text>

              {/* === 1. NAME === */}
              <Text style={styles.modalSectionTitle}>Name</Text>
              <TextInput
                style={styles.modalInput}
                value={newCookbookName}
                onChangeText={setNewCookbookName}
                placeholder="Name deines Kochbuchs"
                placeholderTextColor="#A8B8A2"
              />

              {/* === 2. DECKBLATT-FARBE === */}
              <Text style={styles.modalSectionTitle}>Deckblatt-Farbe</Text>
              <View style={styles.colorRow}>
                {PICKER_COLORS.map((c, i) => (
                  <Pressable key={i} onPress={() => setSelectedColor(i)}>
                    <LinearGradient
                      colors={[c[0], c[1]]}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={[styles.colorCircle, selectedColor === i && styles.colorCircleActive]}
                    />
                  </Pressable>
                ))}
              </View>

              {/* === 3. EMOJI-HINTERGRUNDFARBE === */}
              <Text style={styles.modalSectionTitle}>Icon-Farbe</Text>
              <View style={styles.colorRow}>
                {EMOJI_BG_COLORS.map((c, i) => (
                  <Pressable key={i} onPress={() => setSelectedEmojiBg(i)}>
                    <View style={[
                      styles.emojiBgCircle,
                      { backgroundColor: c || "transparent" },
                      !c && styles.emojiBgNone,
                      selectedEmojiBg === i && styles.emojiBgActive,
                    ]}>
                      {!c && <Text style={styles.emojiBgNoneText}>✕</Text>}
                    </View>
                  </Pressable>
                ))}
              </View>

              {/* === 4. EMOJI === */}
              <Text style={styles.modalSectionTitle}>Icon</Text>
              <View style={styles.emojiGrid}>
                {COVER_ICONS.map((img, i) => (
                  <Pressable
                    key={i}
                    style={[
                      styles.emojiItem,
                      { backgroundColor: EMOJI_BG_COLORS[selectedEmojiBg] || "rgba(255,255,255,0.3)" },
                      selectedEmoji === i && styles.emojiItemActive,
                    ]}
                    onPress={() => setSelectedEmoji(i)}
                  >
                    <Image source={img} style={styles.emojiImg} />
                  </Pressable>
                ))}
              </View>

              {/* === 5. TAGS === */}
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
              {selectedTags.filter(t => !PICKER_TAGS.includes(t)).length > 0 && (
                <View style={[styles.tagGrid, { marginBottom: 8 }]}>
                  {selectedTags.filter(t => !PICKER_TAGS.includes(t)).map((t) => (
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
                    style={[styles.tagChip, selectedTags.includes(t) && styles.tagChipActive]}
                    onPress={() => toggleTag(t)}
                  >
                    <Text style={[styles.tagChipText, selectedTags.includes(t) && styles.tagChipTextActive]}>{t}</Text>
                  </Pressable>
                ))}
              </View>

              {/* === BUTTONS === */}
              <Pressable
                style={[styles.modalCreateBtn, !newCookbookName.trim() && { opacity: 0.4 }]}
                onPress={editingCookbook ? handleSaveEdit : handleCreateCookbook}
              >
                <Text style={styles.modalCreateBtnText}>{editingCookbook ? "Änderungen speichern" : "Kochbuch erstellen"}</Text>
              </Pressable>
              <Pressable style={styles.modalCancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.modalCancelBtnText}>Abbrechen</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Pressable>
  );
}

const G = "rgba(42, 56, 37, 0.97)";
const W = (a: number) => `rgba(255,255,255,${a})`;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF2EA" },
  scrollContent: { paddingBottom: 110 },

  // === SUCHE ===
  searchBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  searchInput: {
    backgroundColor: W(0.6), borderRadius: 18, padding: 14, fontSize: 14,
    borderWidth: 0.5, borderColor: W(0.8),
    backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
  } as any,

  sectionLabel: {
    fontSize: 17, fontWeight: "700", color: "#2A3825", letterSpacing: -0.2,
    paddingHorizontal: 16, paddingTop: 22, paddingBottom: 12,
  },

  // === MAGAZINE GRID ===
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12 },
  cardWrapper: { width: "48%" as any, marginHorizontal: "1%" as any, marginBottom: 16 },

  magCard: {
    height: 210,
    borderRadius: 6,
    overflow: "hidden",
    position: "relative" as any,
    boxShadow: "2px 4px 14px rgba(0,0,0,0.15)",
  } as any,
  magGradient: {
    position: "absolute" as any,
    top: 0, left: 0, right: 0, bottom: 0,
  },
  magMenu: {
    position: "absolute" as any, top: 8, right: 8, zIndex: 2,
    backgroundColor: "rgba(0,0,0,0.25)", borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  magIconCircle: {
    position: "absolute" as any, top: "16%" as any, alignSelf: "center",
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
    left: "50%" as any, marginLeft: -24,
    zIndex: 1,
  } as any,
  magIconImg: { width: 34, height: 34, resizeMode: "contain" } as any,
  magMenuDots: { fontSize: 11, color: "rgba(255,255,255,0.7)", letterSpacing: 2 },
  menuDropdown: {
    position: "absolute" as any, top: 36, right: 8, zIndex: 10,
    backgroundColor: "rgba(42,56,37,0.95)", borderRadius: 12,
    overflow: "hidden", minWidth: 140,
    boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.1)",
  } as any,
  menuDropdownItem: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, paddingHorizontal: 14,
  },
  menuDropdownDanger: {
    borderTopWidth: 0.5, borderTopColor: "rgba(255,255,255,0.08)",
  },
  menuDropdownIcon: { fontSize: 14, color: "rgba(255,255,255,0.7)" },
  menuDropdownText: { fontSize: 13, color: "#fff", fontWeight: "600" },
  menuDropdownIconDanger: { fontSize: 14, color: "#E88A8A" },
  menuDropdownTextDanger: { fontSize: 13, color: "#E88A8A", fontWeight: "600" },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#2A3825", letterSpacing: -0.3, marginBottom: 18 },
  magContent: {
    position: "absolute" as any,
    bottom: 0, left: 0, right: 0,
    padding: 12, paddingBottom: 14,
    zIndex: 2,
  },
  magCat: {
    fontSize: 7, textTransform: "uppercase" as any, letterSpacing: 1.5,
    color: "rgba(255,255,255,0.5)", fontWeight: "600", marginBottom: 3,
  },
  magName: {
    fontSize: 18, fontWeight: "900", color: "#fff", lineHeight: 21, letterSpacing: -0.3,
  },
  magSub: { fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 3 },
  magCount: { fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 5 },
  magLine: {
    width: 22, height: 2, backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 1, marginTop: 6,
  },

  // === SLIDER ===
  sliderContent: { paddingLeft: 16, paddingRight: 8 },
  sliderCard: {
    width: 158, height: 200, borderRadius: 6, overflow: "hidden",
    position: "relative" as any, marginRight: 10,
    boxShadow: "2px 4px 12px rgba(0,0,0,0.12)",
  } as any,
  sliderGradient: { position: "absolute" as any, top: 0, left: 0, right: 0, bottom: 0 },
  sliderIconCircle: {
    position: "absolute" as any, top: "18%" as any,
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    alignSelf: "center", left: "50%" as any, marginLeft: -22,
    zIndex: 1,
  } as any,
  sliderIconImg: { width: 30, height: 30, resizeMode: "contain" } as any,
  sliderInfo: {
    position: "absolute" as any, bottom: 0, left: 0, right: 0,
    padding: 10, paddingBottom: 12,
  },
  sliderName: { fontSize: 14, fontWeight: "800", color: "#fff", lineHeight: 17 },
  sliderSub: { fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 3 },

  // === NEUE KATEGORIE ===
  addSection: { paddingHorizontal: 16, paddingTop: 14 },
  addButton: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: W(0.5), borderRadius: 18, padding: 15,
    borderWidth: 0.5, borderColor: W(0.5), gap: 10, cursor: "pointer" as any,
  },
  addPlus: { fontSize: 20, color: "#5A9A4E", fontWeight: "700" },
  addText: { fontSize: 14, color: "#6E8868", fontWeight: "500" },

  // === MODAL ===
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#F4F7F0", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingTop: 14, paddingBottom: 40,
    maxHeight: "88%" as any,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(42,56,37,0.15)",
    alignSelf: "center", marginBottom: 16,
  },
  modalTitle: { fontSize: 22, fontWeight: "800", color: "#2A3825", letterSpacing: -0.5, marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: "#8A9E82", marginBottom: 20 },
  modalInput: {
    backgroundColor: W(0.5), borderRadius: 16, padding: 16, fontSize: 17, fontWeight: "600",
    color: "#2A3825", borderWidth: 0.5, borderColor: W(0.9), marginBottom: 22,
  },
  modalSectionTitle: {
    fontSize: 13, fontWeight: "700", color: "#5A7A52", letterSpacing: 0.3,
    textTransform: "uppercase" as any, marginBottom: 10, marginTop: 4,
  },
  // Farben
  colorRow: { flexDirection: "row", gap: 10, marginBottom: 20, flexWrap: "wrap" },
  colorCircle: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 2, borderColor: "transparent",
  },
  colorCircleActive: {
    borderColor: "#2A3825", borderWidth: 2.5,
    shadowColor: "#2A3825", shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 6,
  },
  // Vorschau
  previewWrap: { alignItems: "center", marginBottom: 24 },
  previewCard: {
    width: 150, height: 200, borderRadius: 6, overflow: "hidden",
    position: "relative" as any,
    boxShadow: "2px 4px 14px rgba(0,0,0,0.18)",
  } as any,
  previewGradient: { position: "absolute" as any, top: 0, left: 0, right: 0, bottom: 0 },
  previewEmojiCircle: {
    position: "absolute" as any, top: "18%" as any, alignSelf: "center",
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    left: "31%" as any,
  } as any,
  previewIconImg: { width: 46, height: 46, resizeMode: "contain" } as any,
  previewContent: { position: "absolute" as any, bottom: 0, left: 0, right: 0, padding: 10, paddingBottom: 12 },
  previewCat: { fontSize: 6, textTransform: "uppercase" as any, letterSpacing: 1.5, color: "rgba(255,255,255,0.5)", fontWeight: "600", marginBottom: 2 },
  previewName: { fontSize: 16, fontWeight: "900", color: "#fff", lineHeight: 19 },
  previewCount: { fontSize: 8, color: "rgba(255,255,255,0.5)", marginTop: 4 },
  previewLine: { width: 18, height: 2, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 1, marginTop: 5 },
  // Emoji-Hintergrundfarbe
  emojiBgCircle: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, borderColor: "transparent",
  },
  emojiBgNone: { borderWidth: 1.5, borderColor: "rgba(42,56,37,0.15)", borderStyle: "dashed" as any, alignItems: "center", justifyContent: "center" },
  emojiBgNoneText: { fontSize: 10, color: "rgba(42,56,37,0.25)" },
  emojiBgActive: { borderColor: "#2A3825", borderWidth: 2.5 },
  // Emoji Grid (Pastell-Kreise)
  emojiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  emojiItem: {
    width: 56, height: 56, borderRadius: 28, overflow: "hidden",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "transparent",
  },
  emojiItemActive: {
    borderColor: "#5A9A4E",
    shadowColor: "#5A9A4E", shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35, shadowRadius: 8,
  },
  emojiImg: { width: 46, height: 46, resizeMode: "contain" } as any,
  // Custom Tags
  customTagRow: { flexDirection: "row", gap: 8, marginBottom: 24 },
  customTagInput: {
    flex: 1, backgroundColor: W(0.6), borderRadius: 14, padding: 10,
    fontSize: 13, borderWidth: 0.5, borderColor: W(0.8),
  },
  customTagBtn: {
    width: 40, backgroundColor: G, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)",
  },
  customTagBtnText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  // Tags
  tagGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  tagChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: W(0.5), borderWidth: 0.5, borderColor: W(0.5),
  },
  tagChipActive: {
    backgroundColor: G, borderColor: "rgba(255,255,255,0.08)",
  },
  tagChipText: { fontSize: 13, fontWeight: "600", color: "#5A7A52" },
  tagChipTextActive: { color: "#fff" },
  // Buttons
  modalCreateBtn: {
    backgroundColor: G, borderRadius: 16, padding: 16, alignItems: "center",
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)",
    boxShadow: "0 4px 16px rgba(42,56,37,0.2)",
    marginBottom: 10,
  } as any,
  modalCreateBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  modalCancelBtn: {
    borderRadius: 16, padding: 14, alignItems: "center",
  },
  modalCancelBtnText: { color: "#8A9E82", fontSize: 14, fontWeight: "600" },

  // === DETAIL HEADER ===
  detailHeader: {
    backgroundColor: G, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18,
    backdropFilter: "blur(50px)", WebkitBackdropFilter: "blur(50px)",
  } as any,
  backButton: { marginBottom: 8 },
  backText: { color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: "600" },
  detailTitle: { fontSize: 22, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
  detailCount: { fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 3 },

  // === REZEPT-KARTEN ===
  recipeList: { padding: 16 },
  recipeCard: {
    backgroundColor: W(0.55), borderRadius: 20, marginBottom: 12, overflow: "hidden",
    borderWidth: 0.5, borderColor: W(0.75),
    boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
  } as any,
  recipeCardMain: { flexDirection: "row", alignItems: "center" },
  recipeThumb: { width: 85, height: 95, resizeMode: "cover", borderRadius: 0 } as any,
  recipeCardBody: { flex: 1, padding: 14 },
  recipeTitle: { fontSize: 15, fontWeight: "700", color: "#2A3825", marginBottom: 3, letterSpacing: -0.2 },
  recipeDesc: { fontSize: 11, color: "#8A9E82", marginBottom: 6, lineHeight: 16 },
  recipeMeta: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  recipeMetaText: { fontSize: 10, color: "#5A9A4E", fontWeight: "600" },
  recipeMetaDot: { marginHorizontal: 4, color: "rgba(42,56,37,0.15)" },
  starsRow: { flexDirection: "row", gap: 2 },
  star: { fontSize: 15, color: "rgba(42,56,37,0.12)" },
  starActive: { color: "#D4A93C" },

  // === ACTIONS ===
  actionRow: {
    flexDirection: "row", borderTopWidth: 0.5,
    borderTopColor: "rgba(42,56,37,0.06)",
  },
  actionButton: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", paddingVertical: 10, gap: 5, cursor: "pointer" as any,
  },
  actionButtonDanger: {},
  actionIcon: { fontSize: 13, color: "#5A9A4E" },
  actionIconDanger: { color: "#9B4444" },
  actionLabel: { fontSize: 11, color: "#6E8868", fontWeight: "600" },
  actionLabelDanger: { color: "#9B4444" },

  // === EMPTY ===
  emptyList: { alignItems: "center", paddingTop: 60 },
  emptyListEmoji: { fontSize: 44, marginBottom: 14 },
  emptyListText: { fontSize: 14, color: "#8A9E82" },
});
