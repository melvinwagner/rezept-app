import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signIn, signUp, resetPassword } from "../services/auth";

type Mode = "login" | "signup";

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const isSignup = mode === "signup";

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require("../assets/dawg-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.eyebrow}>— DAWG Account —</Text>
        <Text style={styles.title}>
          {isSignup ? "Konto erstellen" : "Willkommen zurück"}
        </Text>
        <Text style={styles.subtitle}>
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
            <Text style={[styles.toggleText, !isSignup && styles.toggleTextActive]}>
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
            <Text style={[styles.toggleText, isSignup && styles.toggleTextActive]}>
              Registrieren
            </Text>
          </Pressable>
        </View>

        {isSignup && (
          <>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Dein Name"
              placeholderTextColor="#A8B8A2"
              autoCapitalize="words"
              autoCorrect={false}
            />
          </>
        )}

        <Text style={styles.label}>E-Mail</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="du@beispiel.de"
          placeholderTextColor="#A8B8A2"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
        />

        <Text style={styles.label}>Passwort</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder={isSignup ? "min. 8 Zeichen" : "Passwort"}
          placeholderTextColor="#A8B8A2"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          textContentType={isSignup ? "newPassword" : "password"}
        />

        {!!err && <Text style={styles.err}>{err}</Text>}

        <Pressable
          style={[styles.submit, busy && styles.submitDisabled]}
          onPress={submit}
          disabled={busy}
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
          <Pressable onPress={handleReset}>
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
  container: { flex: 1, backgroundColor: "#EEF2EA" },
  content: { padding: 28, paddingTop: 72, paddingBottom: 60 },

  logo: { width: 56, height: 56, alignSelf: "center" as any, marginBottom: 16 },
  eyebrow: {
    textAlign: "center" as any,
    fontSize: 11,
    letterSpacing: 2,
    color: "#8A9E82",
    textTransform: "uppercase" as any,
    marginBottom: 10,
    fontWeight: "700",
  },
  title: {
    fontFamily: "FrankRuhlLibre_900Black",
    fontSize: 30,
    color: "#2A3825",
    textAlign: "center" as any,
    letterSpacing: -0.7,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: "#5E6E55",
    textAlign: "center" as any,
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },

  toggle: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center" as any,
  } as any,
  toggleActive: { backgroundColor: "#2A3825" },
  toggleText: { fontFamily: "Manrope_700Bold", fontSize: 13, color: "#2A3825", letterSpacing: 0.3 },
  toggleTextActive: { color: "#fff" },

  label: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 10,
    letterSpacing: 1.8,
    color: "#8A9E82",
    marginTop: 14,
    marginBottom: 6,
    textTransform: "uppercase" as any,
  },
  input: {
    backgroundColor: "#FAFCF6",
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: "#2A3825",
    borderWidth: 0.5,
    borderColor: "rgba(42,56,37,0.12)",
  },

  err: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    color: "#B4472E",
    marginTop: 14,
    textAlign: "center" as any,
  },

  submit: {
    marginTop: 22,
    backgroundColor: "rgba(42,56,37,0.97)",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center" as any,
  } as any,
  submitDisabled: { opacity: 0.5 },
  submitText: { fontFamily: "Manrope_700Bold", color: "#fff", fontSize: 15, letterSpacing: 0.3 },

  forgot: {
    textAlign: "center" as any,
    color: "#5A9A4E",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 16,
  },

  legal: {
    textAlign: "center" as any,
    color: "#A8B8A2",
    fontSize: 11,
    marginTop: 28,
    lineHeight: 16,
  },
});
