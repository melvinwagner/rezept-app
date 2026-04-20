import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BugReportButton from "../components/BugReportButton";
import { getSession, onAuthChange } from "../services/auth";
import {
  useFonts as useFrankRuhl,
  FrankRuhlLibre_500Medium,
  FrankRuhlLibre_700Bold,
  FrankRuhlLibre_900Black,
} from "@expo-google-fonts/frank-ruhl-libre";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import {
  Unbounded_700Bold,
  Unbounded_800ExtraBold,
} from "@expo-google-fonts/unbounded";
import { Syncopate_700Bold } from "@expo-google-fonts/syncopate";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [fontsLoaded] = useFrankRuhl({
    FrankRuhlLibre_500Medium,
    FrankRuhlLibre_700Bold,
    FrankRuhlLibre_900Black,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Unbounded_700Bold,
    Unbounded_800ExtraBold,
    Syncopate_700Bold,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [onboardingRaw, session] = await Promise.all([
        AsyncStorage.getItem("onboarding_completed"),
        getSession(),
      ]);
      if (cancelled) return;

      const onboardingDone = onboardingRaw === "true";
      const sessionActive = !!session;
      const inOnboarding = segments[0] === "onboarding";
      const inAuth = segments[0] === "auth";

      setHasSession(sessionActive);
      setReady(true);

      if (!onboardingDone && !inOnboarding) {
        router.replace("/onboarding");
      } else if (onboardingDone && !sessionActive && !inAuth) {
        router.replace("/auth");
      } else if (sessionActive && onboardingDone && (inAuth || inOnboarding)) {
        router.replace("/(tabs)");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [segments]);

  useEffect(() => {
    const unsubscribe = onAuthChange((session) => {
      setHasSession(!!session);
      if (!session) {
        AsyncStorage.getItem("onboarding_completed").then((v) => {
          if (v === "true") router.replace("/auth");
        });
      }
    });
    return unsubscribe;
  }, []);

  if (!ready || !fontsLoaded) return <View style={{ flex: 1, backgroundColor: "#EEF2EA" }} />;

  const inOnboarding = segments[0] === "onboarding";
  const inAuth = segments[0] === "auth";
  const showBugButton = !inOnboarding && !inAuth;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#2A3825",
            borderBottomWidth: 0,
            shadowOpacity: 0,
            elevation: 0,
          } as any,
          headerTintColor: "#EEF2EA",
          headerTitleStyle: {
            fontFamily: "Unbounded_800ExtraBold",
            fontSize: 15,
            letterSpacing: -0.3,
            color: "#EEF2EA",
          },
        }}
      >
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="recipe/[id]"
          options={{ title: "Rezept", headerBackTitle: "Magazin" }}
        />
      </Stack>
      {showBugButton && <BugReportButton />}
    </>
  );
}
