import { View, Text, StyleSheet, ScrollView } from "react-native";

export default function FeedScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>🍽</Text>
        <Text style={styles.emptyTitle}>Feed kommt bald</Text>
        <Text style={styles.emptyText}>Entdecke Rezepte von anderen DAWG Usern</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF2EA" },
  content: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  emptyState: { alignItems: "center" },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: "bold", color: "#2A3825", marginBottom: 6 },
  emptyText: { fontSize: 14, color: "#98AE92", textAlign: "center" },
});
