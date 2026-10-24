// File: nesora-app/src/components/watch/WatchDetails.tsx
import { useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, EllipsisVertical, Share2, ThumbsUp } from "lucide-react-native";
import CommentsSheet from "@/components/comments/CommentsSheet";
import SubscribeButton from "@/components/feed/SubscribeButton";
import Avatar from "@/components/ui/Avatar";
import { useContentMenu } from "@/hooks/use-content-menu";
import { api } from "@/lib/api";
import { API_URL } from "@/lib/config";
import { formatCount, formatViews, timeAgo } from "@/lib/format";
import type { WatchVideo } from "@/lib/types";
import { useTheme } from "@/theme/ThemeProvider";
import { radius } from "@/theme/colors";

/** Title, channel, actions, description and the comments entry — under the player. */
export default function WatchDetails({ video }: { video: WatchVideo }) {
  const { colors } = useTheme();
  const router = useRouter();
  const [liked, setLiked] = useState(video.liked);
  const [likeCount, setLikeCount] = useState(video.likeCount);
  const [commentCount, setCommentCount] = useState(video.commentCount);
  const [expanded, setExpanded] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const menu = useContentMenu({
    report: { target: "VIDEO", id: video.id },
    block: video.isOwn ? undefined : { kind: "channel", id: video.channel.id, name: video.channel.name },
    onBlocked: () => router.back(),
  });

  async function toggleLike() {
    const next = !liked;
    setLiked(next);
    setLikeCount((n) => Math.max(0, n + (next ? 1 : -1)));
    try {
      const result = await api<{ liked: boolean; likeCount: number }>(`/videos/${video.id}/like`, { method: "POST" });
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      setLiked(!next);
      setLikeCount((n) => Math.max(0, n + (next ? -1 : 1)));
    }
  }

  const openChannel = () => router.push({ pathname: "/channel/[handle]", params: { handle: video.channel.handle } });

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: colors.text }]}>{video.title}</Text>
      <Text style={[styles.stats, { color: colors.muted }]}>
        {formatViews(video.viewCount)} · {timeAgo(video.publishedAt)}
      </Text>

      <View style={styles.channel}>
        <Pressable onPress={openChannel} style={styles.channelLink} accessibilityRole="button">
          <Avatar name={video.channel.name} uri={video.channel.avatarUrl} size={36} />
          <View style={styles.channelText}>
            <Text style={[styles.channelName, { color: colors.text }]} numberOfLines={1}>
              {video.channel.name}
            </Text>
            <Text style={[styles.subs, { color: colors.muted }]}>{formatCount(video.subscriberCount)} subscribers</Text>
          </View>
        </Pressable>
        <SubscribeButton channelId={video.channel.id} initialSubscribed={video.subscribed} isOwn={video.isOwn} />
      </View>

      <View style={styles.actions}>
        <Pill onPress={toggleLike} active={liked} label={likeCount ? formatCount(likeCount) : "Like"}>
          <ThumbsUp size={18} color={liked ? colors.accent : colors.text} fill={liked ? colors.accent : "transparent"} />
        </Pill>
        <Pill onPress={() => Share.share({ message: `${video.title} ${API_URL}/watch/${video.id}` }).catch(() => {})} label="Share">
          <Share2 size={18} color={colors.text} />
        </Pill>
        <Pill onPress={menu.open} label="">
          <EllipsisVertical size={18} color={colors.text} />
        </Pill>
      </View>

      {video.description ? (
        <Pressable onPress={() => setExpanded((e) => !e)} style={[styles.description, { backgroundColor: colors.raised }]}>
          <Text style={[styles.descriptionText, { color: colors.text }]} numberOfLines={expanded ? undefined : 3}>
            {video.description}
          </Text>
          {video.description.length > 140 || video.description.includes("\n") ? (
            <Text style={[styles.more, { color: colors.muted }]}>{expanded ? "Show less" : "…more"}</Text>
          ) : null}
        </Pressable>
      ) : null}

      <Pressable
        onPress={() => setCommentsOpen(true)}
        style={[styles.comments, { backgroundColor: colors.raised }]}
        accessibilityRole="button"
      >
        <Text style={[styles.commentsTitle, { color: colors.text }]}>
          Comments <Text style={{ color: colors.muted, fontWeight: "400" }}>{formatCount(commentCount)}</Text>
        </Text>
        <ChevronRight size={20} color={colors.muted} />
      </Pressable>

      <CommentsSheet videoId={video.id} visible={commentsOpen} onClose={() => setCommentsOpen(false)} onCountChange={setCommentCount} />
      {menu.sheets}
    </View>
  );
}

function Pill({ children, label, onPress, active }: { children: React.ReactNode; label: string; onPress: () => void; active?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label || "More actions"}
      style={({ pressed }) => [styles.pill, { backgroundColor: colors.chip, opacity: pressed ? 0.7 : 1 }]}
    >
      {children}
      {label ? <Text style={[styles.pillText, { color: active ? colors.accent : colors.text }]}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 12, gap: 10 },
  title: { fontSize: 18, fontWeight: "700", lineHeight: 24 },
  stats: { fontSize: 12, marginTop: -4 },
  channel: { flexDirection: "row", alignItems: "center", gap: 10 },
  channelLink: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  channelText: { flex: 1 },
  channelName: { fontSize: 15, fontWeight: "600" },
  subs: { fontSize: 12 },
  actions: { flexDirection: "row", gap: 8 },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: 14, borderRadius: radius.pill },
  pillText: { fontSize: 14, fontWeight: "600" },
  description: { borderRadius: radius.md, padding: 12, gap: 4 },
  descriptionText: { fontSize: 14, lineHeight: 20 },
  more: { fontSize: 13, fontWeight: "600" },
  comments: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: radius.md, padding: 12 },
  commentsTitle: { fontSize: 15, fontWeight: "700" },
});