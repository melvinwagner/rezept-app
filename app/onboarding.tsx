import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Animated,
  Image,
  Modal,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Cover, COVER_LAYOUTS, COVER_PALETTE, CoverLayoutId } from "../components/Cover";
import { colors } from "../constants/theme";

// Onboarding-spezifische Aliase auf Brand-Tokens + lokale Gold-Akzente
const C = {
  bg: colors.bg,
  bgWarm: "#F4F7F0",
  ink: colors.ink,
  inkSoft: "#6E8868",
  inkMute: "#98AE92",
  accent: colors.greenLight,
  accentDeep: colors.green,
  accentInk: colors.accentInk,
  accentLuminous: colors.accentLuminous,
  glassDark: "rgba(42, 56, 37, 0.55)",
  glassDarkStrong: "rgba(42, 56, 37, 0.97)",
  gold: "#f4d88f",
  goldSoft: "rgba(244,216,143,0.6)",
};

const W = (a: number) => `rgba(255,255,255,${a})`;

// ──────────────────────────────────────────────────────────────
// Main Onboarding Screen
// ──────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const total = 6;

  const finish = async () => {
    await AsyncStorage.setItem("onboarding_completed", "true");
    router.replace("/(tabs)");
  };

  const next = () => setStep((s) => Math.min(total - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const slides = [
    <Slide1 key="0" />,
    <Slide2 key="1" />,
    <Slide4 key="2" />,
    <Slide5 key="3" />,
    <Slide3 key="4" />,
    <Slide6 key="5" onFinish={finish} />,
  ];

  return (
    <View style={styles.root}>
      <ProgressBar step={step} total={total} onSkip={finish} />

      <View style={{ flex: 1 }} key={step}>
        {slides[step]}
      </View>

      {step < total - 1 && (
        <BottomNav step={step} total={total} onNext={next} onBack={back} />
      )}
    </View>
  );
}

// ──────────────────────────────────────────────────────────────
// Progress Bar
// ──────────────────────────────────────────────────────────────
function ProgressBar({
  step,
  total,
  onSkip,
}: {
  step: number;
  total: number;
  onSkip: () => void;
}) {
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressBars}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressBar,
              { backgroundColor: i <= step ? C.accent : "rgba(42,56,37,0.12)" },
            ]}
          />
        ))}
      </View>
      {step < total - 1 && (
        <Pressable onPress={onSkip}>
          <Text style={styles.skipText}>Überspringen</Text>
        </Pressable>
      )}
    </View>
  );
}

// ──────────────────────────────────────────────────────────────
// Bottom Nav
// ──────────────────────────────────────────────────────────────
function BottomNav({
  step,
  total,
  onNext,
  onBack,
}: {
  step: number;
  total: number;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <View style={styles.bottomNav}>
      <Pressable onPress={onBack} disabled={step === 0}>
        <Text
          style={[
            styles.backText,
            step === 0 && { color: "transparent" },
          ]}
        >
          ← Zurück
        </Text>
      </Pressable>

      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === step && styles.dotActive,
              { backgroundColor: i === step ? C.accent : "rgba(42,56,37,0.15)" },
            ]}
          />
        ))}
      </View>

      <Pressable onPress={onNext} style={styles.nextBtn}>
        <Text style={styles.nextBtnText}>Weiter →</Text>
      </Pressable>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────
// SLIDE 0 — Login / Landing
// ──────────────────────────────────────────────────────────────
function SlideLogin({
  onRegister,
  onLogin,
}: {
  onRegister: () => void;
  onLogin: () => void;
}) {
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const submitName = async () => {
    const n = nameInput.trim();
    if (!n) return;
    await AsyncStorage.setItem("user_name", n);
    setShowNameModal(false);
    setNameInput("");
    onRegister();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 22, paddingTop: 56, paddingBottom: 30 }}
    >
      {/* Hero monogram */}
      <View style={{ alignItems: "center", marginTop: 10 }}>
        <View style={styles.monogram}>
          <View style={styles.monogramInner}>
            <Text style={styles.monogramD}>D</Text>
          </View>
        </View>
        <Text style={styles.eyebrow}>— Willkommen —</Text>
        <Text style={styles.heroTitle}>
          Dein Kochbuch.{"\n"}
          <Text style={{ color: C.accent }}>Deine Edition.</Text>
        </Text>
        <Text style={styles.heroLede}>
          Sammle Rezepte, schreibe eigene Ausgaben und koche mit den Menschen,
          die du liebst.
        </Text>
      </View>

      {/* Feature cards */}
      <View style={styles.featureRow}>
        <FeatureCard emoji="⏱" title="Rezepte in Sekunden" />
        <FeatureCard emoji="📊" title="Nährwerte im Überblick" />
        <FeatureCard emoji="👍" title="Jedes Gericht gelingt" />
      </View>

      {/* Login buttons */}
      <View style={{ marginTop: 18, gap: 8 }}>
        <Pressable
          onPress={() => setShowNameModal(true)}
          style={styles.nameBtn}
        >
          <Text style={styles.nameBtnEmoji}>✏️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.nameBtnLabel}>Weiter mit Name</Text>
            <Text style={styles.nameBtnHint}>HIER KLICKEN</Text>
          </View>
        </Pressable>
        <LoginBtn provider="apple" label="Weiter mit Apple" onPress={onRegister} />
        <LoginBtn provider="google" label="Weiter mit Google" onPress={onRegister} />
        <LoginBtn provider="facebook" label="Weiter mit Facebook" onPress={onRegister} />
        <LoginBtn provider="instagram" label="Weiter mit Instagram" onPress={onRegister} />
        <LoginBtn provider="email" label="Weiter mit Email" onPress={onRegister} />
      </View>

      <Modal
        visible={showNameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNameModal(false)}
      >
        <Pressable
          style={styles.nameModalOverlay}
          onPress={() => setShowNameModal(false)}
        >
          <Pressable style={styles.nameModalCard} onPress={() => {}}>
            <Text style={styles.nameModalTitle}>Wie heißt du?</Text>
            <Text style={styles.nameModalDesc}>
              Wird überall in der App angezeigt.
            </Text>
            <TextInput
              style={styles.nameModalInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Dein Name"
              placeholderTextColor="#A8B8A2"
              autoFocus
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={submitName}
            />
            <Pressable
              style={[styles.nameModalBtn, !nameInput.trim() && { opacity: 0.4 }]}
              disabled={!nameInput.trim()}
              onPress={submitName}
            >
              <Text style={styles.nameModalBtnText}>Weiter →</Text>
            </Pressable>
            <Pressable
              style={styles.nameModalCancel}
              onPress={() => setShowNameModal(false)}
            >
              <Text style={styles.nameModalCancelText}>Abbrechen</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={{ marginTop: 14, alignItems: "center" }}>
        <Text style={styles.loginLine}>
          Du hast schon einen Account?{" "}
          <Text style={styles.loginLink} onPress={onLogin}>
            Anmelden
          </Text>
        </Text>
      </View>

      <Text style={styles.legal}>
        Mit dem Fortfahren akzeptierst du unsere{" "}
        <Text style={styles.legalLink}>AGB</Text>,{" "}
        <Text style={styles.legalLink}>Datenschutzbestimmungen</Text> und{" "}
        <Text style={styles.legalLink}>Cookie-Richtlinie</Text>.
      </Text>
    </ScrollView>
  );
}

function FeatureCard({ emoji, title }: { emoji: string; title: string }) {
  return (
    <View style={styles.featureCard}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <Text style={styles.featureTitle}>{title}</Text>
    </View>
  );
}

function LoginBtn({
  provider,
  label,
  onPress,
}: {
  provider: "apple" | "google" | "facebook" | "instagram" | "email";
  label: string;
  onPress: () => void;
}) {
  const styles_: Record<string, { bg: string; fg: string; icon: string }> = {
    apple: { bg: "#000", fg: "#fff", icon: "" },
    google: { bg: "#fff", fg: "#1f1f1f", icon: "G" },
    facebook: { bg: "#1877F2", fg: "#fff", icon: "f" },
    instagram: { bg: "#fff", fg: "#1f1f1f", icon: "◈" },
    email: { bg: C.glassDarkStrong, fg: "#fff", icon: "✉" },
  };
  const s = styles_[provider];
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.loginBtn,
        { backgroundColor: s.bg },
        provider === "google" || provider === "instagram"
          ? { borderWidth: 0.5, borderColor: "rgba(0,0,0,0.12)" }
          : null,
      ]}
    >
      <View style={styles.loginBtnIcon}>
        <Text style={[styles.loginBtnIconText, { color: s.fg }]}>
          {s.icon}
        </Text>
      </View>
      <Text style={[styles.loginBtnLabel, { color: s.fg }]}>{label}</Text>
    </Pressable>
  );
}

// ──────────────────────────────────────────────────────────────
// SLIDE 1 — Willkommen
// ──────────────────────────────────────────────────────────────
function Slide1() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("user_name").then((n) => {
      if (n && n.trim()) setName(n.trim().split(/\s+/)[0]);
    });
  }, []);

  return (
    <LinearGradient
      colors={["#F4F7F0", C.bg]}
      style={{ flex: 1, padding: 28, paddingTop: 96, paddingBottom: 120 }}
    >
      <View style={{ alignItems: "center", marginTop: 40 }}>
        <LinearGradient
          colors={["#8AAA7A", "#1E2E1A"]}
          style={styles.brandCircleBig}
        >
          <Image
            source={require("../assets/dawg-logo.png")}
            style={{ width: 62, height: 62, resizeMode: "contain" }}
          />
        </LinearGradient>

        <Text style={styles.eyebrow}>— Willkommen bei DAWG —</Text>
        <Text style={styles.slide1Title}>
          Hallo, <Text style={{ color: C.accent }}>{name ?? "Koch"}.</Text>
          {"\n"}Schön, dass{"\n"}du da bist.
        </Text>
        <Text style={styles.slide1Lede}>
          In den nächsten Sekunden zeigen wir dir, wie aus jedem Video ein
          fertiges Rezept wird — und wie du dein eigenes Food-Magazin
          zusammenstellst.
        </Text>
      </View>
    </LinearGradient>
  );
}

// ──────────────────────────────────────────────────────────────
// SLIDE 2 — Video zu Rezept
// ──────────────────────────────────────────────────────────────
function Slide2() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 24, paddingTop: 96, paddingBottom: 120 }}
    >
      <StepBadge n={2} />
      <Title>
        Jedes <Accent>Video</Accent> wird zum <Accent>Rezept</Accent>.
      </Title>
      <Lede>
        Link aus einem der unterstützten sozialen Medien einfügen und DAWG
        analysiert das Video und baut dir in Sekunden die Anleitung für dein
        nächstes Gericht.
      </Lede>

      {/* Input mock */}
      <Glass style={{ marginTop: 30 }}>
        <View style={styles.inputMock}>
          <Text style={{ color: C.inkMute, fontSize: 13 }}>Link einfügen</Text>
          <View style={styles.cursor} />
        </View>
        <View style={styles.ctaMock}>
          <Text style={styles.ctaMockText}>Rezept erstellen</Text>
        </View>
        <View style={styles.supportRow}>
          {["TikTok", "Instagram", "YouTube"].map((p) => (
            <View key={p} style={styles.supportItem}>
              <View style={styles.supportDot} />
              <Text style={styles.supportText}>{p}</Text>
            </View>
          ))}
        </View>
      </Glass>

      <Text style={{ textAlign: "center", fontSize: 22, color: C.accent, marginVertical: 18 }}>↓</Text>

      {/* Recipe preview */}
      <Glass padding={14}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <LinearGradient
            colors={["#8AAA7A", "#2A3E22"]}
            style={styles.recipeThumb}
          >
            <Image
              source={require("../assets/covers/pasta.png")}
              style={{ width: 40, height: 40, resizeMode: "contain" }}
            />
          </LinearGradient>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.recipeMockTitle}>Cacio e Pepe in 10 Min.</Text>
            <Text style={styles.recipeMockMeta}>
              4 Zutaten · 4 Schritte · 520 kcal
            </Text>
            <View style={styles.creatorBadge}>
              <Text style={styles.creatorText}>TikTok · @Creator</Text>
            </View>
          </View>
        </View>
      </Glass>
    </ScrollView>
  );
}

// ──────────────────────────────────────────────────────────────
// SLIDE 3 (Nährwerte)
// ──────────────────────────────────────────────────────────────
function Slide4() {
  const ings = [
    { a: "200", u: "g", n: "Spaghetti", hl: false },
    { a: "50", u: "g", n: "Pecorino Romano", hl: true },
    { a: "2", u: "TL", n: "Pfeffer, schwarz", hl: false },
  ];
  const macros = [
    { v: "520", l: "kcal" },
    { v: "22g", l: "Protein" },
    { v: "68g", l: "Carbs" },
    { v: "14g", l: "Fett" },
  ];
  const micros = [
    { n: "Eisen", v: "3.2 mg", pct: 0.4 },
    { n: "Calcium", v: "420 mg", pct: 0.55 },
    { n: "Vit. B12", v: "1.1 µg", pct: 0.7 },
    { n: "Zink", v: "4.1 mg", pct: 0.5 },
  ];
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 24, paddingTop: 88, paddingBottom: 120 }}
    >
      <StepBadge n={3} />
      <Title>
        Zutaten zählen. <Accent>Automatisch.</Accent>
      </Title>
      <Lede>
        Portionen skalieren, Zutaten tauschen — lass deinem Geschmack freien
        Lauf, ohne die Übersicht zu verlieren.
      </Lede>

      <Glass style={{ marginTop: 14 }}>
        <View style={styles.ingHeader}>
          <Text style={styles.ingTitle}>Zutaten</Text>
          <View style={styles.servingBadge}>
            <Text style={styles.servingBtn}>−</Text>
            <Text style={styles.servingText}>2 Portionen</Text>
            <Text style={styles.servingBtn}>+</Text>
          </View>
        </View>
        {ings.map((ing, i) => (
          <View key={i} style={styles.ingRow}>
            <Text
              style={[
                styles.ingAmount,
                ing.hl && { color: C.accentDeep },
              ]}
            >
              {ing.a}
            </Text>
            <Text style={styles.ingUnit}>{ing.u}</Text>
            <Text style={styles.ingName}>
              {ing.n}
              {ing.hl && <Text style={styles.ingHl}>  BEARBEITET</Text>}
            </Text>
          </View>
        ))}
      </Glass>

      <View style={{ marginTop: 10 }}>
        <View style={styles.macroHeader}>
          <Text style={styles.macroLabel}>PRO PORTION</Text>
          <Text style={styles.macroLive}>live berechnet</Text>
        </View>
        <View style={styles.macroGrid}>
          {macros.map((m, i) => (
            <View key={i} style={styles.macroCell}>
              <Text style={styles.macroValue}>{m.v}</Text>
              <Text style={styles.macroName}>{m.l}</Text>
            </View>
          ))}
        </View>

        <View style={styles.microCard}>
          <View style={styles.macroHeader}>
            <Text style={styles.macroLabel}>MIKRONÄHRSTOFFE</Text>
            <Text style={styles.macroLive}>% Tagesbedarf</Text>
          </View>
          <View style={styles.microGrid}>
            {micros.map((m, i) => (
              <View key={i} style={{ width: "47%", marginBottom: 8 }}>
                <View style={styles.microLabelRow}>
                  <Text style={styles.microName}>{m.n}</Text>
                  <Text style={styles.microValue}>{m.v}</Text>
                </View>
                <View style={styles.microBarBg}>
                  <View
                    style={[styles.microBarFill, { width: `${Math.round(m.pct * 100)}%` }]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.allergenCard}>
          <View style={styles.macroHeader}>
            <Text style={styles.macroLabel}>ALLERGENE</Text>
            <Text style={styles.macroLive}>enthält</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
            {[
              { n: "Gluten", d: "🌾" },
              { n: "Milch", d: "🥛" },
              { n: "Ei", d: "🥚" },
            ].map((a, i) => (
              <View key={i} style={styles.allergenPill}>
                <Text style={styles.allergenText}>{a.d} {a.n}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ──────────────────────────────────────────────────────────────
// SLIDE 5 — Entdecken
// ──────────────────────────────────────────────────────────────
function Slide5() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 24, paddingTop: 96, paddingBottom: 120 }}
    >
      <StepBadge n={4} />
      <Title>
        Jeden Tag{"\n"}etwas <Accent>Neues.</Accent>
      </Title>
      <Lede>
        Gemüse des Tages, Ernährungs-Fakten, Profi-Tipps — kleine Impulse, die
        dich besser kochen lassen.
      </Lede>

      <Glass style={{ marginTop: 22 }} padding={14}>
        <Text style={styles.cardEyebrow}>🌶️   GEMÜSE DES TAGES</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Image
            source={require("../assets/gemuese/paprika.jpg")}
            style={styles.gemueseImg}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.gemueseName}>Paprika</Text>
            <Text style={styles.gemueseText}>
              Enthält mehr Vitamin C als Orangen — roh gegessen bleibt der
              Gehalt am höchsten.
            </Text>
          </View>
        </View>
      </Glass>

      <Glass style={{ marginTop: 10 }} padding={16}>
        <View style={styles.factHeader}>
          <Text style={styles.cardEyebrow}>FOOD FACT</Text>
          <Text style={styles.factEdition}>№ 04 · 2026</Text>
        </View>
        <View style={styles.factGrid}>
          <View style={{ flex: 1 }}>
            <Text style={styles.factColHeader}>PER HAND</Text>
            <Text style={styles.factNumber}>
              8<Text style={styles.factNumberSmall}> Min.</Text>
            </Text>
            <Text style={styles.factSub}>pausieren, tippen, korrigieren</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.factColHeader}>MIT DAWG</Text>
            <Text style={styles.factWord}>erledigt.</Text>
            <Text style={styles.factSub}>erstellt, während du das liest</Text>
          </View>
        </View>
        <Text style={styles.factBottom}>
          Schluss mit Abtippen — DAWG erkennt jedes Rezept für dich.
        </Text>
      </Glass>

      <Glass style={{ marginTop: 10 }} padding={14}>
        <Text style={styles.cardEyebrow}>💡   TIPP DES TAGES</Text>
        <Text style={styles.tippText}>
          Knoblauch erst 10 Min. nach dem Schneiden erhitzen — so bildet sich
          das gesunde Allicin.
        </Text>
      </Glass>
    </ScrollView>
  );
}

// ──────────────────────────────────────────────────────────────
// SLIDE 5 (Magazin — Deine Ausgaben)
// ──────────────────────────────────────────────────────────────
function Slide3() {
  const books = [
    { name: "Meine Rezepte", sub: "Alle Favoriten", col: ["#6B8B68", "#1E2E1A"] as const, n: 48 },
    { name: "Italienisch", sub: "Pasta & Pizza", col: ["#A09078", "#3A2818"] as const, n: 12 },
    { name: "Asiatisch", sub: "Reis & Sushi", col: ["#8890A0", "#282E3A"] as const, n: 8 },
    { name: "Healthy Bowls", sub: "Leicht & frisch", col: ["#8AAA7A", "#2A3E22"] as const, n: 15 },
    { name: "Desserts", sub: "Süße Seite", col: ["#B09070", "#3A2010"] as const, n: 6 },
    { name: "Frühstück", sub: "Perfekter Start", col: ["#9A8898", "#2E2430"] as const, n: 9 },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 24, paddingTop: 96, paddingBottom: 120 }}
    >
      <StepBadge n={5} />
      <Title>
        Deine <Accent>Magazine.</Accent>
        {"\n"}Deine Handschrift.
      </Title>
      <Lede>
        Erstelle Ausgaben statt langweiliger Listen. Mit DAWG machst du aus
        deinen Lieblingsrezepten einzigartige Food-Magazine — egal ob für dich,
        für Freunde, oder die ganze Welt.
      </Lede>

      <View style={styles.bookGrid}>
        {books.map((b, i) => (
          <LinearGradient key={i} colors={b.col} style={styles.bookCard}>
            <View style={styles.bookContent}>
              <Text style={styles.bookEyebrow}>AUSGABE</Text>
              <Text style={styles.bookName} numberOfLines={1}>{b.name}</Text>
              <Text style={styles.bookSub}>{b.sub}</Text>
              <Text style={styles.bookCount}>{b.n} Rezepte</Text>
              <View style={styles.bookLine} />
            </View>
          </LinearGradient>
        ))}
      </View>

      <Text style={styles.bookFooterNote}>
        Sei nicht nur bei den Rezepten kreativ, sondern auch beim Cover. Jede
        Ausgabe bekommt ihre eigene Farbe, ihren eigenen Titel — und zeigt
        deinen ganz persönlichen Geschmack.
      </Text>
    </ScrollView>
  );
}

// ──────────────────────────────────────────────────────────────
// SLIDE 6 — Autor-Profil (Cover-Preview + CTA)
// ──────────────────────────────────────────────────────────────
function Slide6({ onFinish }: { onFinish: () => void }) {
  const [colorIdx, setColorIdx] = useState(0);
  const [layoutId, setLayoutId] = useState<CoverLayoutId>("classic");
  const [userName, setUserName] = useState("Tester");

  useEffect(() => {
    AsyncStorage.multiGet([
      "cover_color_idx",
      "cover_layout_id",
      "user_name",
    ]).then((entries) => {
      for (const [k, v] of entries) {
        if (!v) continue;
        if (k === "cover_color_idx") {
          const i = parseInt(v, 10);
          if (!Number.isNaN(i) && i >= 0 && i < COVER_PALETTE.length) setColorIdx(i);
        }
        if (k === "cover_layout_id") {
          if (COVER_LAYOUTS.some((l) => l.id === v)) setLayoutId(v as CoverLayoutId);
        }
        if (k === "user_name" && v.trim()) setUserName(v.trim());
      }
    });
  }, []);

  const handleSelectColor = (i: number) => {
    setColorIdx(i);
    AsyncStorage.setItem("cover_color_idx", String(i));
  };
  const handleSelectLayout = (id: CoverLayoutId) => {
    setLayoutId(id);
    AsyncStorage.setItem("cover_layout_id", id);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 40 }}
    >
      <StepBadge n={6} />
      <Title>
        Du bist der{"\n"}
        <Accent>Autor.</Accent>
      </Title>
      <Lede>
        Dein Profil ist deine Titelseite. Wähle Layout und Farbe — anpassen
        kannst du alles später.
      </Lede>

      <View style={{ alignItems: "center", marginTop: 18 }}>
        <Cover
          layout={layoutId}
          gradient={COVER_PALETTE[colorIdx].grad}
          name={userName}
          handle="@du"
        />
      </View>

      <View style={{ marginTop: 18, gap: 12 }}>
        <LayoutPicker
          layouts={COVER_LAYOUTS}
          activeId={layoutId}
          onSelect={handleSelectLayout}
        />
        <PickerColors
          colors={COVER_PALETTE}
          activeIndex={colorIdx}
          onSelect={handleSelectColor}
        />
      </View>

      <Pressable style={styles.ctaFinal} onPress={onFinish}>
        <Text style={styles.ctaFinalText}>Los geht's →</Text>
      </Pressable>
      <Text style={styles.ctaHint}>
        Alle Einstellungen kannst du im Autor-Tab ändern.
      </Text>
    </ScrollView>
  );
}

function LayoutPicker({
  layouts,
  activeId,
  onSelect,
}: {
  layouts: { id: CoverLayoutId; name: string }[];
  activeId: CoverLayoutId;
  onSelect: (id: CoverLayoutId) => void;
}) {
  return (
    <View>
      <Text style={styles.pickerLabel}>LAYOUT</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6 }}
      >
        {layouts.map((l) => {
          const active = l.id === activeId;
          return (
            <Pressable
              key={l.id}
              onPress={() => onSelect(l.id)}
              style={[styles.pickerChip, active && styles.pickerChipActive]}
            >
              <Text
                style={[
                  styles.pickerChipText,
                  active && { color: "#fff" },
                ]}
              >
                {l.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function PickerColors({
  colors,
  activeIndex,
  onSelect,
}: {
  colors: { name: string; grad: [string, string] }[];
  activeIndex: number;
  onSelect: (i: number) => void;
}) {
  return (
    <View>
      <Text style={styles.pickerLabel}>HINTERGRUND</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6 }}
      >
        {colors.map((c, i) => (
          <Pressable key={i} onPress={() => onSelect(i)}>
            <LinearGradient
              colors={c.grad}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={[
                styles.pickerSwatch,
                i === activeIndex && styles.pickerSwatchActive,
              ]}
            />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────
// Shared atoms
// ──────────────────────────────────────────────────────────────
function StepBadge({ n }: { n: number }) {
  return <Text style={styles.stepBadge}>SCHRITT {n} · 6</Text>;
}

function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

function Lede({ children }: { children: React.ReactNode }) {
  return <Text style={styles.lede}>{children}</Text>;
}

function Accent({ children }: { children: React.ReactNode }) {
  return <Text style={{ color: C.accent }}>{children}</Text>;
}

function Glass({
  children,
  padding = 18,
  style,
}: {
  children: React.ReactNode;
  padding?: number;
  style?: any;
}) {
  return (
    <View style={[styles.glass, { padding }, style]}>{children}</View>
  );
}

// ──────────────────────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Progress
  progressWrap: {
    position: "absolute",
    top: 56,
    left: 24,
    right: 24,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressBars: { flexDirection: "row", gap: 4, flex: 1 },
  progressBar: { flex: 1, height: 3, borderRadius: 2 },
  skipText: { fontSize: 12, fontWeight: "600", color: C.inkSoft, letterSpacing: 0.2 },

  // Bottom Nav
  bottomNav: {
    position: "absolute",
    bottom: 38,
    left: 24,
    right: 24,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  backText: { fontSize: 14, fontWeight: "600", color: C.inkSoft, padding: 10 },
  dots: { flexDirection: "row", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { width: 18 },
  nextBtn: {
    backgroundColor: C.glassDarkStrong,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    boxShadow: "0 6px 18px rgba(42,56,37,0.22)",
  } as any,
  nextBtnText: { color: "#fff", fontSize: 13, fontWeight: "700", letterSpacing: 0.3 },

  // SlideLogin
  monogram: {
    width: 56,
    height: 56,
    borderRadius: 16,
    marginBottom: 14,
    backgroundColor: "#2A3825",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    boxShadow: "0 10px 30px rgba(42,56,37,0.25)",
  } as any,
  monogramInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.2,
    borderColor: C.goldSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  monogramD: { fontSize: 16, fontWeight: "900", color: C.gold },
  eyebrow: {
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 3,
    color: C.accent,
    marginBottom: 8,
    textTransform: "uppercase" as any,
    textAlign: "center" as any,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1.1,
    color: C.ink,
    textAlign: "center" as any,
    marginBottom: 10,
    lineHeight: 30,
  },
  heroLede: {
    fontSize: 13.5,
    lineHeight: 19,
    color: C.inkSoft,
    textAlign: "center" as any,
    paddingHorizontal: 6,
  },
  featureRow: { flexDirection: "row", gap: 8, marginTop: 20 },
  featureCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: W(0.9),
    boxShadow: "0 2px 10px rgba(42,56,37,0.06)",
    gap: 8,
  } as any,
  featureEmoji: { fontSize: 32 },
  featureTitle: {
    fontSize: 10.5,
    fontWeight: "700",
    color: C.ink,
    textAlign: "center" as any,
    lineHeight: 13,
  },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 14,
    boxShadow: "0 3px 10px rgba(0,0,0,0.06)",
  } as any,
  nameBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: C.accent,
    borderWidth: 0.5,
    borderColor: C.accentDeep,
    boxShadow: "0 4px 14px rgba(122,170,110,0.35)",
  } as any,
  nameBtnEmoji: { fontSize: 20 },
  nameBtnLabel: { color: "#fff", fontSize: 14.5, fontWeight: "800", letterSpacing: 0.1 },
  nameBtnHint: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 1,
  },
  nameModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center" as any,
    justifyContent: "center" as any,
    padding: 26,
  } as any,
  nameModalCard: {
    width: "100%" as any,
    maxWidth: 340,
    backgroundColor: "#F4F7F0",
    borderRadius: 20,
    padding: 22,
  } as any,
  nameModalTitle: { fontSize: 20, fontWeight: "900", color: C.ink, letterSpacing: -0.4 },
  nameModalDesc: { fontSize: 12.5, color: C.inkSoft, marginTop: 4, marginBottom: 14 },
  nameModalInput: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    fontWeight: "600",
    color: C.ink,
    borderWidth: 0.5,
    borderColor: "rgba(42,56,37,0.12)",
    marginBottom: 12,
  },
  nameModalBtn: {
    backgroundColor: C.glassDarkStrong,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center" as any,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
  } as any,
  nameModalBtnText: { color: "#fff", fontSize: 14, fontWeight: "700", letterSpacing: 0.3 },
  nameModalCancel: { marginTop: 6, paddingVertical: 10, alignItems: "center" as any } as any,
  nameModalCancelText: { color: C.inkSoft, fontSize: 13, fontWeight: "600" },
  loginBtnIcon: { width: 20, height: 20, alignItems: "center", justifyContent: "center" },
  loginBtnIconText: { fontSize: 16, fontWeight: "800" },
  loginBtnLabel: { flex: 1, fontSize: 14.5, fontWeight: "700", letterSpacing: 0.1 },
  loginLine: { fontSize: 12.5, color: C.inkSoft },
  loginLink: {
    color: C.ink,
    fontWeight: "700",
    textDecorationLine: "underline" as any,
  },
  legal: {
    marginTop: 16,
    paddingTop: 6,
    fontSize: 10.5,
    lineHeight: 16,
    color: C.inkMute,
    textAlign: "center" as any,
  },
  legalLink: { textDecorationLine: "underline" as any },

  // Slide 1
  brandCircleBig: {
    width: 108,
    height: 108,
    borderRadius: 54,
    marginBottom: 28,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 18px 40px rgba(30,46,26,0.3)",
  } as any,
  slide1Title: {
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: -2,
    color: C.ink,
    textAlign: "center" as any,
    marginBottom: 18,
    lineHeight: 46,
  },
  slide1Lede: {
    fontSize: 15,
    lineHeight: 22,
    color: C.inkSoft,
    textAlign: "center" as any,
    maxWidth: 300,
  },

  // Slides 2-6 shared atoms
  stepBadge: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: C.accent,
    textTransform: "uppercase" as any,
    marginBottom: 14,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.3,
    color: C.ink,
    marginBottom: 14,
    lineHeight: 37,
  },
  lede: { fontSize: 15.5, lineHeight: 22, color: C.inkSoft },

  glass: {
    backgroundColor: W(0.6),
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: W(0.8),
    boxShadow: "0 6px 28px rgba(0,0,0,0.06)",
  } as any,

  // Slide 2
  inputMock: {
    backgroundColor: W(0.7),
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    borderColor: W(0.8),
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cursor: {
    width: 1,
    height: 16,
    backgroundColor: C.accent,
  },
  ctaMock: {
    marginTop: 10,
    backgroundColor: C.glassDark,
    borderRadius: 14,
    padding: 13,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: W(0.08),
  },
  ctaMockText: { color: "#fff", fontSize: 13, fontWeight: "600", letterSpacing: 0.3 },
  supportRow: { flexDirection: "row", justifyContent: "center", gap: 14, marginTop: 12 },
  supportItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  supportDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.accent },
  supportText: { fontSize: 10, color: C.inkMute, fontWeight: "500" },
  recipeThumb: {
    width: 60,
    height: 72,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  recipeMockTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: C.ink,
    letterSpacing: -0.2,
    lineHeight: 17,
  },
  recipeMockMeta: { fontSize: 11, color: C.inkSoft, marginTop: 4, lineHeight: 15 },
  creatorBadge: {
    backgroundColor: C.glassDark,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  creatorText: { fontSize: 7.5, color: "rgba(255,255,255,0.85)", fontWeight: "600" },

  // Slide 4 - Nährwerte
  ingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  ingTitle: { fontSize: 14, fontWeight: "700", color: C.ink },
  servingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.glassDark,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  servingBtn: { color: "#fff", fontSize: 12, fontWeight: "600", width: 16, textAlign: "center" as any },
  servingText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  ingRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingVertical: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(42,56,37,0.06)",
  },
  ingAmount: { width: 38, fontSize: 13, fontWeight: "700", color: C.ink, textAlign: "right" as any },
  ingUnit: { width: 28, fontSize: 11, color: C.inkMute },
  ingName: { flex: 1, fontSize: 13, color: C.ink },
  ingHl: {
    fontSize: 8,
    fontWeight: "700",
    color: C.accentDeep,
    letterSpacing: 0.3,
  },
  macroHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  macroLabel: { fontSize: 10, fontWeight: "700", color: C.inkSoft, letterSpacing: 0.4 },
  macroLive: { fontSize: 9, fontWeight: "600", color: C.inkMute, letterSpacing: 0.2 },
  macroGrid: { flexDirection: "row", gap: 6 },
  macroCell: {
    flex: 1,
    backgroundColor: W(0.5),
    borderWidth: 0.5,
    borderColor: W(0.7),
    borderRadius: 14,
    paddingVertical: 9,
    alignItems: "center",
  },
  macroValue: { fontSize: 15, fontWeight: "700", color: C.accentDeep },
  macroName: { fontSize: 9, color: C.inkMute, marginTop: 2 },
  microCard: {
    marginTop: 10,
    backgroundColor: W(0.45),
    borderWidth: 0.5,
    borderColor: W(0.7),
    borderRadius: 14,
    padding: 12,
  },
  microGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  microLabelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  microName: { fontSize: 11, color: C.ink, fontWeight: "600" },
  microValue: { fontSize: 10, color: C.inkSoft, fontWeight: "500" },
  microBarBg: { height: 3, borderRadius: 2, backgroundColor: "rgba(42,56,37,0.08)", overflow: "hidden" as any },
  microBarFill: { height: "100%" as any, backgroundColor: C.accentDeep, borderRadius: 2 },
  allergenCard: {
    marginTop: 10,
    backgroundColor: W(0.45),
    borderWidth: 0.5,
    borderColor: W(0.7),
    borderRadius: 14,
    padding: 12,
  },
  allergenPill: {
    backgroundColor: "rgba(183,77,48,0.10)",
    borderWidth: 0.5,
    borderColor: "rgba(183,77,48,0.22)",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  allergenText: { fontSize: 11, fontWeight: "600", color: "#9B3E22" },

  // Slide 5
  cardEyebrow: {
    fontSize: 9,
    fontWeight: "700",
    color: C.inkSoft,
    letterSpacing: 0.6,
    textTransform: "uppercase" as any,
    marginBottom: 10,
  },
  gemueseImg: { width: 90, height: 90, borderRadius: 14 },
  gemueseName: { fontSize: 18, fontWeight: "800", color: C.ink, letterSpacing: -0.3 },
  gemueseText: { fontSize: 11.5, color: C.inkSoft, lineHeight: 16, marginTop: 4 },
  factHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  factEdition: { fontSize: 8, fontWeight: "600", color: C.inkMute, letterSpacing: 0.4 },
  factGrid: { flexDirection: "row", gap: 16 },
  factColHeader: {
    fontSize: 8,
    fontWeight: "700",
    color: C.accentDeep,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  factNumber: { fontSize: 40, fontWeight: "800", color: C.accentDeep, letterSpacing: -1.6, lineHeight: 40 },
  factNumberSmall: { fontSize: 12, fontWeight: "700" },
  factWord: { fontSize: 26, fontWeight: "800", color: C.accentDeep, letterSpacing: -1, lineHeight: 32 },
  factSub: { fontSize: 10, fontWeight: "500", color: C.inkSoft, lineHeight: 13, marginTop: 4 },
  factBottom: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(42,56,37,0.10)",
    fontSize: 11,
    color: C.inkSoft,
    lineHeight: 15,
  },
  tippText: { fontSize: 12.5, color: C.ink, lineHeight: 18 },

  // Slide 3 — Magazine Grid
  bookGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 24 },
  bookCard: {
    width: "31%" as any,
    aspectRatio: 0.68,
    borderRadius: 6,
    overflow: "hidden" as any,
    boxShadow: "2px 4px 14px rgba(0,0,0,0.18)",
  } as any,
  bookContent: { position: "absolute" as any, bottom: 0, left: 0, right: 0, padding: 10 },
  bookEyebrow: { fontSize: 6, color: "rgba(255,255,255,0.55)", fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" as any },
  bookName: { fontSize: 13, fontWeight: "900", color: "#fff", lineHeight: 14, letterSpacing: -0.3, marginTop: 2 },
  bookSub: { fontSize: 7, color: "rgba(255,255,255,0.55)", marginTop: 2 },
  bookCount: { fontSize: 7, color: "rgba(255,255,255,0.55)", marginTop: 4 },
  bookLine: { width: 16, height: 1.5, backgroundColor: "rgba(255,255,255,0.35)", borderRadius: 1, marginTop: 5 },
  bookFooterNote: {
    marginTop: 18,
    fontSize: 11,
    color: C.inkMute,
    textAlign: "center" as any,
    fontStyle: "italic" as any,
    lineHeight: 15,
  },

  // Slide 6
  coverPreview: {
    width: 180,
    aspectRatio: 2 / 3,
    borderRadius: 6,
    overflow: "hidden" as any,
    boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
    position: "relative" as any,
  } as any,
  coverSpine: { position: "absolute" as any, left: 0, top: 0, bottom: 0, width: 3, backgroundColor: "rgba(0,0,0,0.25)", zIndex: 5 },
  coverBrand: {
    position: "absolute" as any,
    top: "5%" as any,
    left: 0,
    right: 0,
    textAlign: "center" as any,
    color: "rgba(244,216,143,0.6)",
    fontSize: 7,
    letterSpacing: 2,
    fontWeight: "700",
  },
  coverCrest: {
    position: "absolute" as any,
    top: "11%" as any,
    left: "50%" as any,
    marginLeft: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.goldSoft,
    alignItems: "center" as any,
    justifyContent: "center" as any,
  } as any,
  coverCrestLetter: { color: C.gold, fontSize: 20, fontWeight: "900" },
  coverDiv: {
    position: "absolute" as any,
    left: "14%" as any,
    right: "14%" as any,
    height: 0.5,
    backgroundColor: "rgba(244,216,143,0.35)",
  } as any,
  coverTitle: {
    position: "absolute" as any,
    top: "36%" as any,
    left: 10,
    right: 10,
    textAlign: "center" as any,
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.8,
    lineHeight: 26,
  },
  coverSubtitle: {
    position: "absolute" as any,
    top: "56%" as any,
    left: 10,
    right: 10,
    textAlign: "center" as any,
    fontSize: 7,
    color: "rgba(244,216,143,0.5)",
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  coverStats: {
    position: "absolute" as any,
    top: "66%" as any,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between" as any,
  } as any,
  coverStat: { flex: 1, alignItems: "center" as any },
  coverStatVal: { color: "#fff", fontSize: 16, fontWeight: "900" },
  coverStatLbl: { color: "rgba(244,216,143,0.5)", fontSize: 6, fontWeight: "700", letterSpacing: 1, marginTop: 2 },
  coverEdition: {
    position: "absolute" as any,
    bottom: 8,
    left: 0,
    right: 0,
    textAlign: "center" as any,
    fontSize: 7,
    color: "rgba(244,216,143,0.4)",
    letterSpacing: 1.5,
    fontWeight: "700",
  },

  pickerLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.6,
    color: C.inkMute,
    marginBottom: 7,
  },
  pickerChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 0.5,
    borderColor: W(0.9),
  },
  pickerChipActive: { backgroundColor: C.ink, borderColor: C.ink },
  pickerChipText: { fontSize: 11, fontWeight: "700", color: C.ink, letterSpacing: 0.2 },
  pickerSwatch: { width: 34, height: 34, borderRadius: 10 },
  pickerSwatchActive: { borderWidth: 2, borderColor: C.ink },

  ctaFinal: {
    marginTop: 22,
    backgroundColor: C.glassDarkStrong,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: W(0.1),
    boxShadow: "0 8px 24px rgba(42,56,37,0.25)",
  } as any,
  ctaFinalText: { color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.3 },
  ctaHint: {
    textAlign: "center" as any,
    marginTop: 8,
    fontSize: 11,
    color: C.inkMute,
    fontWeight: "500",
  },
});
