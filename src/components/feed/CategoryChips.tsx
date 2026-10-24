// File: nesora-app/src/components/feed/CategoryChips.tsx
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import type { Category } from "@/lib/types";
import { useTheme } from "@/theme/ThemeProvider";
import { radius } from "@/theme/colors";

type Props = { categories: Category[]; selected: string | null; onSelect: (slug: string | null) => void };

/** Top chips on Home. Plain text — emoji only appear in the sign-up picker. */
export default function CategoryChips({ categories, selected, onSelect }: Props) {
  const { colors } = useTheme();
  const chip = (slug: string | null, label: string) => {
    const on = selected === slug;
    return (
      <Pressable
        key={slug ?? "all"}
        onPress={() => onSelect(slug)}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
        style={[styles.chip, { backgroundColor: on ? colors.inverseBg : colors.chip }]}
      >
        <Text style={[styles.label, { color: on ? colors.inverseText : colors.text }]}>{label}</Text>
      </Pressable>
    );
  };
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {chip(null, "All")}
      {categories.map((c) => chip(c.slug, c.name))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  chip: { height: 32, paddingHorizontal: 12, borderRadius: radius.sm, justifyContent: "center" },
  label: { fontSize: 14, fontWeight: "500" },
});