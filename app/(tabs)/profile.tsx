import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
} from "react-native";

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.username}>Gastbenutzer</Text>
        <Text style={styles.subtitle}>Melde dich an um deine Rezepte zu synchronisieren</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Rezepte</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Kochbücher</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Favoriten</Text>
        </View>
      </View>

      <Pressable style={styles.loginButton}>
        <Text style={styles.loginButtonText}>Anmelden</Text>
      </Pressable>

      <View style={styles.menuSection}>
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuIcon}>📊</Text>
          <Text style={styles.menuText}>Meine Statistiken</Text>
          <Text style={styles.menuArrow}>›</Text>
        </Pressable>
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuIcon}>🔔</Text>
          <Text style={styles.menuText}>Benachrichtigungen</Text>
          <Text style={styles.menuArrow}>›</Text>
        </Pressable>
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuIcon}>🌿</Text>
          <Text style={styles.menuText}>Ernährungspräferenzen</Text>
          <Text style={styles.menuArrow}>›</Text>
        </Pressable>
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuIcon}>💬</Text>
          <Text style={styles.menuText}>Feedback geben</Text>
          <Text style={styles.menuArrow}>›</Text>
        </Pressable>
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuIcon}>📄</Text>
          <Text style={styles.menuText}>Datenschutz & AGB</Text>
          <Text style={styles.menuArrow}>›</Text>
        </Pressable>
      </View>

      <Text style={styles.version}>DAWG v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF2EA" },
  content: { padding: 20, paddingBottom: 100 },
  avatarSection: { alignItems: "center", marginBottom: 24, marginTop: 10 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(42, 56, 37, 0.08)",
    borderWidth: 0.5,
    borderColor: "rgba(42, 56, 37, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 36 },
  username: { fontSize: 22, fontWeight: "bold", color: "#2A3825" },
  subtitle: { fontSize: 13, color: "#98AE92", marginTop: 4, textAlign: "center" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.8)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  } as any,
  statItem: { alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "bold", color: "#7BAA6E" },
  statLabel: { fontSize: 11, color: "#98AE92", marginTop: 2 },
  loginButton: {
    backgroundColor: "rgba(42, 56, 37, 0.55)",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    marginBottom: 24,
    boxShadow: "0 6px 24px rgba(42,56,37,0.18)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
  } as any,
  loginButtonText: { color: "#fff", fontSize: 15, fontWeight: "600", letterSpacing: 0.3 },
  menuSection: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.8)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  } as any,
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(42,56,37,0.05)",
  },
  menuIcon: { fontSize: 17, marginRight: 14 },
  menuText: { flex: 1, fontSize: 14, color: "#2A3825" },
  menuArrow: { fontSize: 18, color: "rgba(42,56,37,0.2)" },
  version: { textAlign: "center", color: "#C2D0BC", fontSize: 12, marginTop: 24 },
});
