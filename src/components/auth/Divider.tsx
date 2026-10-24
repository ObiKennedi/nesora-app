// File: nesora-app/src/components/auth/Divider.tsx
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

export default function Divider({ label = "or" }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
      <Text style={{ color: colors.muted, fontSize: 13 }}>{label}</Text>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
});