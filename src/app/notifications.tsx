// File: nesora-app/src/app/notifications.tsx
import { useEffect } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import EmptyState from "@/components/feedback/EmptyState";
import Avatar from "@/components/ui/Avatar";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import type { NotificationItem } from "@/lib/types";
import { useTheme } from "@/theme/ThemeProvider";

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api<{ notifications: NotificationItem[] }>("/notifications")).notifications,
  });

  // Opening the list marks everything read (like the website).
  useEffect(() => {
    if (!query.data?.some((n) => n.unread)) return;
    api("/notifications", { method: "POST" })
      .then(() => queryClient.invalidateQueries({ queryKey: ["me"] }))
      .catch(() => {});
  }, [query.data, queryClient]);

  function open(n: NotificationItem) {
    if (n.video.href.startsWith("/shorts/")) router.push({ pathname: "/shorts", params: { start: n.video.id } });
    else router.push({ pathname: "/watch/[id]", params: { id: n.video.id } });
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={query.data ?? []}
      keyExtractor={(n) => n.id}
      renderItem={({ item }) => (
        <Pressable onPress={() => open(item)} style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.hover : "transparent" }]}>
          <View style={[styles.dot, { backgroundColor: item.unread ? colors.accent : "transparent" }]} />
          <Avatar name={item.channel.name} uri={item.channel.avatarUrl} size={40} />
          <View style={styles.text}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={3}>
              <Text style={{ fontWeight: "700" }}>{item.channel.name}</Text> uploaded: {item.video.title}
            </Text>
            <Text style={[styles.time, { color: colors.muted }]}>{timeAgo(item.createdAt)}</Text>
          </View>
          <View style={[styles.thumb, { backgroundColor: colors.raised }]}>
            {item.video.thumbnailUrl ? <Image source={{ uri: item.video.thumbnailUrl }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
          </View>
        </Pressable>
      )}
      ListEmptyComponent={
        query.isPending ? (
          <ActivityIndicator style={{ marginTop: 64 }} color={colors.muted} />
        ) : (
          <EmptyState title="No notifications yet" text="Subscribe to channels and you'll hear about their new uploads here." />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingRight: 12, paddingLeft: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { flex: 1, gap: 4 },
  title: { fontSize: 14, lineHeight: 19 },
  time: { fontSize: 12 },
  thumb: { width: 96, aspectRatio: 16 / 9, borderRadius: 8, overflow: "hidden" },
});