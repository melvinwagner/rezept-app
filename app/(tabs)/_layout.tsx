import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FF6B35",
        tabBarInactiveTintColor: "#999",
        headerStyle: { backgroundColor: "#FF6B35" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
        tabBarStyle: {
          borderTopColor: "#eee",
          paddingBottom: 4,
          paddingTop: 4,
          height: 56,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Neues Rezept",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>+</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Kochbuch",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>&#9733;</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Einstellungen",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>&#9881;</Text>
          ),
        }}
      />
    </Tabs>
  );
}
