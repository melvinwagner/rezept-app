import { Tabs } from "expo-router";
import { Text, Image, View } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "rgba(255,255,255,0.5)",
        headerStyle: {
          backgroundColor: "rgba(123, 170, 110, 0.85)",
          borderBottomWidth: 0,
          shadowOpacity: 0,
          elevation: 0,
        } as any,
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600", fontSize: 18, letterSpacing: 0.5 },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: "500",
          marginTop: 1,
          letterSpacing: 0.2,
        },
        tabBarStyle: {
          backgroundColor: "rgba(42, 56, 37, 0.97)",
          borderTopWidth: 0,
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
          paddingHorizontal: 6,
          marginHorizontal: 14,
          marginBottom: 24,
          borderRadius: 22,
          position: "absolute" as any,
          borderWidth: 0.5,
          borderColor: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(50px)",
          WebkitBackdropFilter: "blur(50px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        } as any,
        tabBarItemStyle: {
          paddingVertical: 2,
          borderRadius: 14,
          marginHorizontal: 2,
        },
        tabBarActiveBackgroundColor: "rgba(255, 255, 255, 0.13)",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "DAWG",
          tabBarLabel: "Start",
          headerRight: () => (
            <Image
              source={require("../../assets/dawg-logo.png")}
              style={{ width: 30, height: 30, marginRight: 14 }}
              resizeMode="contain"
            />
          ),
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("../../assets/dawg-logo.png")}
              style={{ width: 24, height: 24, opacity: focused ? 1 : 0.5 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Magazin",
          tabBarLabel: "Magazin",
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("../../assets/icon-book.png")}
              style={{ width: 22, height: 22, opacity: focused ? 1 : 0.5 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Autor",
          tabBarLabel: "Autor",
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("../../assets/icon-profile.png")}
              style={{ width: 22, height: 22, opacity: focused ? 1 : 0.5 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarLabel: "Settings",
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("../../assets/icon-settings.png")}
              style={{ width: 22, height: 22, opacity: focused ? 1 : 0.5 }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}
