// File: nesora-app/src/components/feed/InterestsModal.tsx
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { Category } from "@/lib/types";
import { useTheme } from "@/theme/ThemeProvider";
import { radius } from "@/theme/colors";

/**
 * Category picker shown once, right after sign-up (same as the website).
 * Picking or skipping closes it for good.
 */
export default function InterestsModal({ visible, categories }: { visible: boolean; categories: Category[] }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  function toggle(id: string) {
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function finish(skip: boolean) {
    setBusy(true);
    try {
      await api("/me/interests", { method: "POST", body: skip ? { skip: true } : { categoryIds: [...picked] } });
    } finally {
      setBusy(false);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["home"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => finish(true)}>
      <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: 24, paddingBottom: insets.bottom + 16 }]}>
        <Text style={[styles.title, { color: colors.text }]}>What do you like to watch?</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Pick a few. We&apos;ll show you more of these on Home.</Text>
        <ScrollView contentContainerStyle={styles.grid}>
          {categories.map((c) => {
            const on = picked.has(c.id);
            return (
              <Pressable
                key={c.id}
                onPress={() => toggle(c.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                style={[
                  styles.option,
                  { backgroundColor: on ? colors.warmBg : colors.chip, borderColor: on ? colors.accent : "transparent" },
                ]}
              >
                <Text style={styles.emoji}>{c.emoji ?? "✨"}</Text>
                <Text style={[styles.name, { color: colors.text }]}>{c.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={styles.actions}>
          <Button title="Skip" variant="ghost" onPress={() => finish(true)} disabled={busy} />
          <Button
            title={picked.size ? `Continue (${picked.size})` : "Continue"}
            variant="primary"
            loading={busy}
            disabled={picked.size === 0}
            onPress={() => finish(false)}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20, gap: 6 },
  title: { fontSize: 24, fontWeight: "800" },
  subtitle: { fontSize: 15, marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingBottom: 16 },
  option: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, height: 44, borderRadius: radius.pill, borderWidth: 1.5 },
  emoji: { fontSize: 18 },
  name: { fontSize: 15, fontWeight: "600" },
  actions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8 },
});