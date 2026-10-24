// File: nesora-app/src/components/feed/VideoCard.tsx
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import Avatar from "@/components/ui/Avatar";
import { formatDuration, formatViews, timeAgo } from "@/lib/format";
import type { FeedVideo } from "@/lib/types";
import { useTheme } from "@/theme/ThemeProvider";

/** Full-width card like YouTube mobile: thumbnail, then avatar + title + meta. */
function VideoCard({ video, replace }: { video: FeedVideo; replace?: boolean }) {
  const { colors } = useTheme();
  const router = useRouter();
  const open = () => {
    const href = { pathname: "/watch/[id]" as const, params: { id: video.id } };
    if (replace) router.replace(href);
    else router.push(href);
  };
  const openChannel = () => router.push({ pathname: "/channel/[handle]", params: { handle: video.channel.handle } });

  return (
    <View style={styles.card}>
      <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={video.title}>
        <View style={[styles.thumb, { backgroundColor: colors.raised }]}>
          {video.thumbnailUrl ? <Image source={{ uri: video.thumbnailUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} /> : null}
          {video.durationSec ? (
            <View style={styles.duration}>
              <Text style={styles.durationText}>{formatDuration(video.durationSec)}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
      <View style={styles.body}>
        <Pressable onPress={openChannel} hitSlop={6} accessibilityLabel={video.channel.name}>
          <Avatar name={video.channel.name} uri={video.channel.avatarUrl} size={36} />
        </Pressable>
        <Pressable onPress={open} style={styles.text}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {video.title}
          </Text>
          <Text style={[styles.meta, { color: colors.muted }]} numberOfLines={1}>
            {video.channel.name} · {formatViews(video.viewCount)} · {timeAgo(video.publishedAt)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default memo(VideoCard);

const styles = StyleSheet.create({
  card: { marginBottom: 20 },
  thumb: { width: "100%", aspectRatio: 16 / 9, justifyContent: "flex-end", alignItems: "flex-end" },
  duration: { margin: 8, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, backgroundColor: "rgba(0,0,0,0.8)" },
  durationText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  body: { flexDirection: "row", gap: 12, paddingHorizontal: 12, paddingTop: 10 },
  text: { flex: 1, gap: 3 },
  title: { fontSize: 15, fontWeight: "600", lineHeight: 20 },
  meta: { fontSize: 12 },
});