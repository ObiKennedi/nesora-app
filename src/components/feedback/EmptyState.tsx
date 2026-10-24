// File: nesora-app/src/components/feedback/EmptyState.tsx
import { StyleSheet, Text, View } from "react-native";
import Button from "@/components/ui/Button";
import { useTheme } from "@/theme/ThemeProvider";

type Props = { title: string; text?: string; action?: { label: string; onPress: () => void } };

export default function EmptyState({ title, text, action }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {text ? <Text style={[styles.text, { color: colors.muted }]}>{text}</Text> : null}
      {action ? <Button title={action.label} variant="primary" onPress={action.onPress} style={styles.button} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingHorizontal: 32, paddingVertical: 56, gap: 8 },
  title: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  text: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  button: { alignSelf: "center", marginTop: 8 },
});