// File: nesora-app/src/app/(tabs)/subscriptions.tsx
import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import AppHeader from "@/components/AppHeader";
import ShortsShelf from "@/components/feed/ShortsShelf";
import VideoList from "@/components/feed/VideoList";
import EmptyState from "@/components/feedback/EmptyState";
import Avatar from "@/components/ui/Avatar";
import { api } from "@/lib/api";
import type { SubscriptionsResponse } from "@/lib/types";
import { useTheme } from "@/theme/ThemeProvider";

export default function SubscriptionsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const feed = useInfiniteQuery({
    queryKey: ["subscriptions"],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => api<SubscriptionsResponse>("/feed/subscriptions", { query: { offset: pageParam } }),
    getNextPageParam: (last) => last.videos.nextOffset ?? undefined,
  });

  const first = feed.data?.pages[0];
  const videos = useMemo(() => feed.data?.pages.flatMap((p) => p.videos.items) ?? [], [feed.data]);
  const channels = first?.channels ?? [];

  const header =
    channels.length > 0 ? (
      <View>
        <FlatList
          horizontal
          data={channels}
          keyExtractor={(c) => c.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}
          renderItem={({ item }) => (
            <Pressable style={styles.channel} onPress={() => router.push({ pathname: "/channel/[handle]", params: { handle: item.handle } })}>
              <Avatar name={item.name} uri={item.avatarUrl} size={56} />
              <Text style={[styles.channelName, { color: colors.muted }]} numberOfLines={1}>
                {item.name}
              </Text>
            </Pressable>
          )}
        />
        {first?.shorts?.length ? <ShortsShelf shorts={first.shorts} /> : null}
        {videos.length ? <Text style={[styles.heading, { color: colors.text }]}>Latest</Text> : null}
      </View>
    ) : undefined;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <AppHeader />
      <VideoList
        videos={videos}
        header={header}
        loading={feed.isPending}
        loadingMore={feed.isFetchingNextPage}
        refreshing={feed.isRefetching && !feed.isFetchingNextPage}
        onRefresh={() => void feed.refetch()}
        onEndReached={() => feed.hasNextPage && !feed.isFetchingNextPage && feed.fetchNextPage()}
        empty={
          channels.length ? (
            <EmptyState title="No videos yet" text="Channels you subscribe to haven't posted long videos yet." />
          ) : (
            <EmptyState
              title="No subscriptions yet"
              text="Subscribing is free. Subscribe to creators you like and you'll be notified whenever they upload."
              action={{ label: "Find creators", onPress: () => router.navigate("/") }}
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  strip: { gap: 14, paddingHorizontal: 12, paddingVertical: 12 },
  channel: { width: 64, alignItems: "center", gap: 6 },
  channelName: { fontSize: 11, textAlign: "center" },
  heading: { fontSize: 18, fontWeight: "700", paddingHorizontal: 12, marginBottom: 12 },
});