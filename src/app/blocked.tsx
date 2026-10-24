// File: nesora-app/src/app/blocked.tsx
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import EmptyState from "@/components/feedback/EmptyState";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { BlockedUser } from "@/lib/types";
import { useTheme } from "@/theme/ThemeProvider";

export default function BlockedScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["blocked"], queryFn: async () => (await api<{ blocked: BlockedUser[] }>("/blocks")).blocked });

  async function unblock(userId: string) {
    queryClient.setQueryData<BlockedUser[]>(["blocked"], (list) => list?.filter((b) => b.userId !== userId));
    await api(`/blocks/${userId}`, { method: "DELETE" }).catch(() => {});
    // Their videos can show again everywhere.
    queryClient.invalidateQueries();
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={styles.list}
      data={query.data ?? []}
      keyExtractor={(b) => b.userId}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Avatar name={item.name} uri={item.avatarUrl} size={40} />
          <View style={styles.text}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.handle ? <Text style={{ color: colors.muted, fontSize: 13 }}>@{item.handle}</Text> : null}
          </View>
          <Button title="Unblock" size="sm" onPress={() => unblock(item.userId)} />
        </View>
      )}
      ListEmptyComponent={
        query.isPending ? (
          <ActivityIndicator style={{ marginTop: 64 }} color={colors.muted} />
        ) : (
          <EmptyState title="You haven't blocked anyone" text="Block people from the ⋮ menu on their videos, Shorts, comments or channel." />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  text: { flex: 1 },
  name: { fontSize: 15, fontWeight: "600" },
});