import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BugReportButton from "../components/BugReportButton";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem("onboarding_completed").then((v) => {
      if (cancelled) return;
      const isCompleted = v === "true";
      const inOnboarding = segments[0] === "onboarding";
      setReady(true);
      if (!isCompleted && !inOnboarding) {
        router.replace("/onboarding");
      } else if (isCompleted && inOnboarding) {
        router.replace("/(tabs)");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [segments]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: "#EEF2EA" }} />;

  const inOnboarding = segments[0] === "onboarding";

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "rgba(123, 170, 110, 0.85)",
            borderBottomWidth: 0,
            shadowOpacity: 0,
            elevation: 0,
          } as any,
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="recipe/[id]"
          options={{ title: "Rezept", headerBackTitle: "Magazin" }}
        />
      </Stack>
      {!inOnboarding && <BugReportButton />}
    </>
  );
}
