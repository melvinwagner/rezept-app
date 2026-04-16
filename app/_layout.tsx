import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "rgba(123, 170, 110, 0.85)", borderBottomWidth: 0, shadowOpacity: 0, elevation: 0 } as any,
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="recipe/[id]"
          options={{ title: "Rezept" }}
        />
      </Stack>
    </>
  );
}
