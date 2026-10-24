// File: nesora-app/src/components/feedback/ComingSoon.tsx
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

/** Temporary body for screens that arrive in the next batches. */
export default function ComingSoon({ title, text }: { title: string; text: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.text, { color: colors.muted }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 8 },
  title: { fontSize: 20, fontWeight: "700" },
  text: { fontSize: 15, textAlign: "center", lineHeight: 21 },
});