// File: nesora-app/src/app/channel/[handle].tsx
import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { EllipsisVertical } from "lucide-react-native";
import SubscribeButton from "@/components/feed/SubscribeButton";
import ShortsShelf from "@/components/feed/ShortsShelf";
import VideoList from "@/components/feed/VideoList";
import EmptyState from "@/components/feedback/EmptyState";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { useContentMenu } from "@/hooks/use-content-menu";
import { api, ApiError } from "@/lib/api";
import { formatCount } from "@/lib/format";
import { openOnWeb } from "@/lib/handoff";
import type { ChannelPage, ChannelResponse } from "@/lib/types";
import { useTheme } from "@/theme/ThemeProvider";

type Tab = "videos" | "shorts";

export default function ChannelScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("videos");

  const query = useInfiniteQuery({
    queryKey: ["channel", handle, tab],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => api<ChannelResponse>(`/channels/${encodeURIComponent(handle)}`, { query: { tab, offset: pageParam } }),
    getNextPageParam: (last) => last.videos?.nextOffset ?? undefined,
  });

  const channel = query.data?.pages[0]?.channel;
  const videos = useMemo(() => query.data?.pages.flatMap((p) => p.videos?.items ?? []) ?? [], [query.data]);
  const shorts = query.data?.pages[0]?.shorts ?? [];

  if (query.isError) {
    return (
      <>
        <Stack.Screen options={{ title: `@${handle}` }} />
        <EmptyState
          title="Channel not found"
          text={query.error instanceof ApiError ? query.error.message : "Check your connection and try again."}
          action={{ label: "Go back", onPress: () => router.back() }}
        />
      </>
    );
  }

  const header = channel ? (
    <View>
      <ChannelHeader channel={channel} />
      {channel.blocked ? null : (
        <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
          {(["videos", "shorts"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tab, { borderBottomColor: tab === t ? colors.text : "transparent" }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t }}
            >
              <Text style={[styles.tabText, { color: tab === t ? colors.text : colors.muted }]}>{t === "videos" ? "Videos" : "Shorts"}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {!channel.blocked && tab === "shorts" ? (
        shorts.length ? (
          <View style={styles.shorts}>
            <ShortsShelf shorts={shorts} title="Shorts" />
          </View>
        ) : (
          <EmptyState title="No Shorts yet" text={channel.isOwn ? "Clips of 1:30 or less are posted as Shorts." : "This channel hasn't posted any Shorts yet."} />
        )
      ) : null}
    </View>
  ) : undefined;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ title: channel ? channel.name : `@${handle}` }} />
      <VideoList
        videos={tab === "videos" && !channel?.blocked ? videos : []}
        header={header}
        loading={query.isPending}
        loadingMore={query.isFetchingNextPage}
        refreshing={query.isRefetching && !query.isFetchingNextPage}
        onRefresh={() => void query.refetch()}
        onEndReached={() => tab === "videos" && query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
        empty={
          channel && !channel.blocked && tab === "videos" ? (
            <EmptyState
              title="No videos yet"
              text={channel.isOwn ? "Upload your first video from Nesora Studio on the website." : "This channel hasn't posted any videos yet."}
              action={channel.isOwn ? { label: "Open Studio", onPress: () => openOnWeb("/studio") } : undefined}
            />
          ) : undefined
        }
      />
    </View>
  );
}

function ChannelHeader({ channel }: { channel: ChannelPage }) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const menu = useContentMenu({
    report: { target: "CHANNEL", id: channel.id },
    block: channel.isOwn || channel.blocked ? undefined : { kind: "channel", id: channel.id, name: channel.name },
  });

  async function unblock() {
    try {
      await api(`/blocks/${channel.ownerUserId}`, { method: "DELETE" });
      queryClient.invalidateQueries();
    } catch (e) {
      Alert.alert("Couldn't unblock", e instanceof ApiError ? e.message : "Try again.");
    }
  }

  return (
    <View>
      <View style={[styles.banner, { backgroundColor: colors.warmBg }]}>
        {channel.bannerUrl ? <Image source={{ uri: channel.bannerUrl }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
      </View>
      <View style={styles.header}>
        <Avatar name={channel.name} uri={channel.avatarUrl} size={72} />
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
            {channel.name}
          </Text>
          <Text style={[styles.meta, { color: colors.muted }]}>
            @{channel.handle} · {formatCount(channel.subscriberCount)} {channel.subscriberCount === 1 ? "subscriber" : "subscribers"} ·{" "}
            {channel.longCount} {channel.longCount === 1 ? "video" : "videos"}
          </Text>
        </View>
      </View>
      {channel.bio ? (
        <Text style={[styles.bio, { color: colors.muted }]} numberOfLines={3}>
          {channel.bio}
        </Text>
      ) : null}
      <View style={styles.actions}>
        {channel.isOwn ? (
          <Button title="Manage on the website" onPress={() => openOnWeb("/studio")} />
        ) : channel.blocked ? (
          <Button title="Unblock" onPress={unblock} />
        ) : (
          <SubscribeButton channelId={channel.id} initialSubscribed={channel.subscribed} />
        )}
        {!channel.isOwn ? (
          <Pressable onPress={menu.open} style={[styles.more, { backgroundColor: colors.chip }]} accessibilityLabel="More actions">
            <EllipsisVertical size={18} color={colors.text} />
          </Pressable>
        ) : null}
      </View>
      {channel.blocked ? (
        <View style={[styles.blocked, { borderColor: colors.border }]}>
          <Text style={{ color: colors.muted }}>You blocked this channel, so its videos and comments are hidden from you.</Text>
        </View>
      ) : null}
      {menu.sheets}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  banner: { width: "100%", aspectRatio: 6 / 1.4, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 12, paddingTop: 14 },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  meta: { fontSize: 13 },
  bio: { fontSize: 14, lineHeight: 20, paddingHorizontal: 12, paddingTop: 10 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4 },
  more: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  blocked: { margin: 12, padding: 14, borderWidth: 1, borderRadius: 14 },
  tabs: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth, marginTop: 8, marginBottom: 12 },
  tab: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 2 },
  tabText: { fontSize: 15, fontWeight: "600" },
  shorts: { marginTop: 4 },
});