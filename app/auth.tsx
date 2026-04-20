import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signIn, signUp, resetPassword } from "../services/auth";
import { colors, fonts, radii, typography } from "../constants/theme";
import {
  AppleLogo,
  GoogleLogo,
  FacebookLogo,
  InstagramLogo,
  EmailLogo,
} from "../components/BrandLogos";

type View_ = "picker" | "email";
type Mode = "signup" | "login";

export default function AuthScreen() {
  const router = useRouter();
  const [view, setView] = useState<View_>("picker");
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const isSignup = mode === "signup";

  const runX = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const screenW = Dimensions.get("window").width;

  useEffect(() => {
    if (view !== "picker") return;
    runX.setValue(0);
    const run = Animated.loop(
      Animated.timing(runX, {
        toValue: 1,
        duration: 5200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    run.start();
    bobLoop.start();
    return () => {
      run.stop();
      bobLoop.stop();
    };
  }, [view, runX, bob]);

  const dogX = runX.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, screenW + 20],
  });
  const dogBobY = bob.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3],
  });

  const openEmail = (m: Mode) => {
    setMode(m);
    setErr("");
    setView("email");
  };

  const socialSoon = (name: string) => {
    Alert.alert(
      `${name} kommt bald`,
      "Dieser Anmeldeweg wird in Kürze aktiviert. Starte vorerst mit Email."
    );
  };

  const submit = async () => {
    setErr("");
    if (!email.trim() || !password) {
      setErr("E-Mail und Passwort sind erforderlich.");
      return;
    }
    if (isSignup && !displayName.trim()) {
      setErr("Bitte gib einen Namen ein.");
      return;
    }
    if (isSignup && password.length < 8) {
      setErr("Passwort muss mindestens 8 Zeichen haben.");
      return;
    }

    setBusy(true);
    try {
      if (isSignup) {
        await signUp(email, password, displayName);
        await AsyncStorage.setItem("user_name", displayName.trim());
      } else {
        await signIn(email, password);
      }
      router.replace("/(tabs)");
    } catch (e: any) {
      setErr(e?.message || "Anmeldung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (!email.trim()) {
      setErr("Gib zuerst deine E-Mail ein.");
      return;
    }
    try {
      await resetPassword(email);
      Alert.alert(
        "Mail gesendet",
        "Falls ein Account existiert, haben wir dir einen Reset-Link geschickt."
      );
    } catch (e: any) {
      setErr(e?.message || "Konnte nicht gesendet werden.");
    }
  };

  if (view === "picker") {
    return (
      <View style={styles.pickerRoot}>
        {/* TOP — Ink Masthead */}
        <View style={styles.topHalf}>
          {/* Dog walking left → right in the header strip */}
          <View pointerEvents="none" style={styles.walkStrip}>
            <Animated.Image
              source={require("../assets/dawg-logo.png")}
              resizeMode="contain"
              style={[
                styles.walkDog,
                {
                  transform: [
                    { translateX: dogX },
                    { translateY: dogBobY },
                  ],
                },
              ]}
            />
          </View>

          <Text style={styles.heroTitle}>
            Hier wird <Text style={styles.heroAccent}>gekocht.</Text>{"\n"}
            Nicht <Text style={styles.heroAccent}>gescrollt.</Text>
          </Text>
          <Text style={styles.heroSub}>
            Dein Kochbuch, aus den Videos, die du liebst.
          </Text>
        </View>

        {/* Pistachio divider */}
        <View style={styles.divider} />

        {/* BOTTOM — Cream Providers */}
        <ScrollView
          style={styles.bottomHalf}
          contentContainerStyle={styles.bottomContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>— Wähle deinen Weg —</Text>

          <Pressable
            style={[styles.pbtn, styles.pbtnApple]}
            onPress={() => socialSoon("Apple")}
            accessibilityRole="button"
            accessibilityLabel="Mit Apple anmelden"
          >
            <View style={styles.pbtnIco}>
              <AppleLogo size={18} color="#fff" />
            </View>
            <Text style={styles.pbtnLabel}>Weiter mit Apple</Text>
            <View style={styles.pbtnSpacer} />
          </Pressable>

          <Pressable
            style={[styles.pbtn, styles.pbtnLight]}
            onPress={() => socialSoon("Google")}
            accessibilityRole="button"
            accessibilityLabel="Mit Google anmelden"
          >
            <View style={styles.pbtnIco}>
              <GoogleLogo size={18} />
            </View>
            <Text style={[styles.pbtnLabel, styles.pbtnLabelDark]}>
              Weiter mit Google
            </Text>
            <View style={styles.pbtnSpacer} />
          </Pressable>

          <Pressable
            style={[styles.pbtn, styles.pbtnLight]}
            onPress={() => socialSoon("Facebook")}
            accessibilityRole="button"
            accessibilityLabel="Mit Facebook anmelden"
          >
            <View style={styles.pbtnIco}>
              <FacebookLogo size={18} color="#1877F2" />
            </View>
            <Text style={[styles.pbtnLabel, styles.pbtnLabelDark]}>
              Weiter mit Facebook
            </Text>
            <View style={styles.pbtnSpacer} />
          </Pressable>

          <Pressable
            style={[styles.pbtn, styles.pbtnLight]}
            onPress={() => socialSoon("Instagram")}
            accessibilityRole="button"
            accessibilityLabel="Mit Instagram anmelden"
          >
            <View style={styles.pbtnIco}>
              <InstagramLogo size={18} />
            </View>
            <Text style={[styles.pbtnLabel, styles.pbtnLabelDark]}>
              Weiter mit Instagram
            </Text>
            <View style={styles.pbtnSpacer} />
          </Pressable>

          <Pressable
            style={[styles.pbtn, styles.pbtnLight]}
            onPress={() => openEmail("signup")}
            accessibilityRole="button"
            accessibilityLabel="Mit Email registrieren"
          >
            <View style={styles.pbtnIco}>
              <EmailLogo size={18} color={colors.ink} />
            </View>
            <Text style={[styles.pbtnLabel, styles.pbtnLabelDark]}>
              Weiter mit Email
            </Text>
            <View style={styles.pbtnSpacer} />
          </Pressable>

          <Pressable
            onPress={() => openEmail("login")}
            style={styles.switchRow}
            accessibilityRole="button"
            accessibilityLabel="Zur Anmeldung für bestehende Konten"
          >
            <Text style={styles.switchText}>
              Schon dabei? <Text style={styles.switchLink}>Anmelden</Text>
            </Text>
          </Pressable>

          <Text style={styles.legal}>
            Mit Fortfahren akzeptierst du unsere Datenschutzrichtlinie und
            Nutzungsbedingungen.
          </Text>
        </ScrollView>
      </View>
    );
  }

  // ========== EMAIL FORM ==========
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.emailRoot}
    >
      <ScrollView
        contentContainerStyle={styles.emailContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => setView("picker")}
          style={styles.backRow}
          accessibilityRole="button"
          accessibilityLabel="Zurück zur Anmelde-Auswahl"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backLabel}>Zurück</Text>
        </Pressable>

        <Text style={styles.eyebrow}>— DAWG Konto —</Text>
        <Text style={styles.emailTitle}>
          {isSignup ? (
            <>
              Konto{"\n"}
              <Text style={styles.emailTitleAc}>erstellen.</Text>
            </>
          ) : (
            <>
              Willkommen{"\n"}
              <Text style={styles.emailTitleAc}>zurück.</Text>
            </>
          )}
        </Text>
        <Text style={styles.emailSub}>
          {isSignup
            ? "Deine Rezepte. Dein Magazin. Sicher in der Cloud."
            : "Melde dich an, um auf deine Rezepte zuzugreifen."}
        </Text>

        <View style={styles.toggle}>
          <Pressable
            style={[styles.toggleBtn, !isSignup && styles.toggleActive]}
            onPress={() => {
              setMode("login");
              setErr("");
            }}
          >
            <Text
              style={[styles.toggleText, !isSignup && styles.toggleTextActive]}
            >
              Anmelden
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, isSignup && styles.toggleActive]}
            onPress={() => {
              setMode("signup");
              setErr("");
            }}
          >
            <Text
              style={[styles.toggleText, isSignup && styles.toggleTextActive]}
            >
              Registrieren
            </Text>
          </Pressable>
        </View>

        {isSignup && (
          <>
            <Text style={styles.label} accessibilityRole="text">
              Name
            </Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Dein Name"
              placeholderTextColor={colors.sageFaint}
              autoCapitalize="words"
              autoCorrect={false}
              accessibilityLabel="Dein Name"
            />
          </>
        )}

        <Text style={styles.label} accessibilityRole="text">
          E-Mail
        </Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (err) setErr("");
          }}
          placeholder="du@beispiel.de"
          placeholderTextColor={colors.sageFaint}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="off"
          textContentType="none"
          accessibilityLabel="E-Mail-Adresse"
        />

        <Text style={styles.label} accessibilityRole="text">
          Passwort
        </Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            if (err) setErr("");
          }}
          placeholder={isSignup ? "min. 8 Zeichen" : "Passwort"}
          placeholderTextColor={colors.sageFaint}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
          accessibilityLabel="Passwort"
        />

        {!!err && <Text style={styles.err}>{err}</Text>}

        <Pressable
          style={[styles.submit, busy && styles.submitDisabled]}
          onPress={submit}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={isSignup ? "Konto erstellen" : "Anmelden"}
          accessibilityState={{ disabled: busy, busy }}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>
              {isSignup ? "Konto erstellen" : "Anmelden"}
            </Text>
          )}
        </Pressable>

        {!isSignup && (
          <Pressable
            onPress={handleReset}
            accessibilityRole="button"
            accessibilityLabel="Passwort zurücksetzen"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.forgot}>Passwort vergessen?</Text>
          </Pressable>
        )}

        <Text style={styles.legal}>
          Mit {isSignup ? "Registrieren" : "Anmelden"} bestätigst du unsere
          Datenschutzrichtlinie und Nutzungsbedingungen.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // ====================================================
  // PICKER
  // ====================================================
  pickerRoot: { flex: 1, backgroundColor: colors.bg },

  topHalf: {
    backgroundColor: colors.ink,
    paddingTop: 116,
    paddingBottom: 40,
    paddingHorizontal: 28,
    overflow: "hidden",
    position: "relative",
  },
  walkStrip: {
    position: "absolute",
    top: 66,
    left: 0,
    right: 0,
    height: 34,
    zIndex: 1,
  },
  walkDog: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 44,
    height: 34,
    tintColor: colors.accentLuminous,
  },
  heroTitle: {
    fontFamily: fonts.displayBlack,
    fontSize: 38,
    lineHeight: 40,
    letterSpacing: -0.8,
    color: colors.bg,
    marginBottom: 10,
  },
  heroAccent: { color: colors.accentLuminous },
  heroSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(238,242,234,0.72)",
    maxWidth: 280,
  },

  divider: {
    height: 2,
    backgroundColor: colors.accentLuminous,
  },

  bottomHalf: { flex: 1, backgroundColor: colors.bg },
  bottomContent: {
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 32,
  },

  sectionLabel: {
    fontFamily: fonts.eyebrowCaps,
    fontSize: 10,
    letterSpacing: 2.4,
    textTransform: "uppercase" as const,
    color: colors.sageDim,
    marginBottom: 14,
  },

  pbtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    marginBottom: 8,
  },
  pbtnApple: { backgroundColor: "#0b0c08" },
  pbtnLight: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.cardBorderInk,
  },
  pbtnIco: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  pbtnLabel: {
    flex: 1,
    textAlign: "center",
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: "#fff",
    letterSpacing: 0.1,
  },
  pbtnLabelDark: { color: colors.ink },
  pbtnSpacer: { width: 22 },

  switchRow: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 4,
  },
  switchText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.inkMuted,
  },
  switchLink: {
    fontFamily: fonts.bodyBold,
    color: colors.accentInk,
    textDecorationLine: "underline",
  },

  legal: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    lineHeight: 15,
    color: colors.sageFaint,
    textAlign: "center",
    marginTop: 4,
  },

  // ====================================================
  // EMAIL FORM
  // ====================================================
  emailRoot: { flex: 1, backgroundColor: colors.bg },
  emailContent: { padding: 28, paddingTop: 72, paddingBottom: 60 },

  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  backArrow: {
    fontFamily: fonts.displayBlack,
    fontSize: 22,
    color: colors.ink,
    marginRight: 8,
  },
  backLabel: {
    fontFamily: fonts.eyebrowCaps,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.sageDim,
  },

  eyebrow: {
    textAlign: "center",
    fontSize: 10,
    letterSpacing: 2,
    color: colors.sageDim,
    textTransform: "uppercase",
    marginBottom: 14,
    fontFamily: fonts.eyebrowCaps,
  },
  emailTitle: {
    fontFamily: fonts.displayBlack,
    fontSize: 34,
    color: colors.ink,
    textAlign: "center",
    letterSpacing: -0.7,
    lineHeight: 38,
  },
  emailTitleAc: { color: colors.accentInk },
  emailSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.inkMuted,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 26,
    lineHeight: 20,
  },

  toggle: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: radii.md,
    padding: 4,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.sm,
    alignItems: "center",
  },
  toggleActive: { backgroundColor: colors.ink },
  toggleText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.ink,
    letterSpacing: 0.3,
  },
  toggleTextActive: { color: "#fff" },

  label: {
    fontFamily: fonts.eyebrowCaps,
    fontSize: 10,
    letterSpacing: 1.8,
    color: colors.sageDim,
    marginTop: 14,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: colors.paper,
    borderRadius: radii.md,
    padding: 14,
    fontSize: 15,
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
    borderWidth: 0.5,
    borderColor: colors.cardBorderInk,
  },

  err: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.error,
    marginTop: 14,
    textAlign: "center",
  },

  submit: {
    marginTop: 22,
    backgroundColor: colors.ink,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: "center",
  },
  submitDisabled: { opacity: 0.5 },
  submitText: {
    fontFamily: fonts.bodyBold,
    color: "#fff",
    fontSize: 15,
    letterSpacing: 0.3,
  },

  forgot: {
    textAlign: "center",
    color: colors.accentInk,
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    marginTop: 16,
  },
});
