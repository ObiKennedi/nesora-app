// File: nesora-app/src/components/shorts/ShortSlide.tsx
import { memo, useEffect, useRef, useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useEvent } from "expo";
import { useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { EllipsisVertical, MessageSquareText, Play, Share2, ThumbsUp, Volume2, VolumeX } from "lucide-react-native";
import CommentsSheet from "@/components/comments/CommentsSheet";
import SubscribeButton from "@/components/feed/SubscribeButton";
import Avatar from "@/components/ui/Avatar";
import { useContentMenu } from "@/hooks/use-content-menu";
import { api } from "@/lib/api";
import { API_URL } from "@/lib/config";
import { formatCount } from "@/lib/format";
import { publicStream } from "@/lib/mux";
import type { ShortItem } from "@/lib/types";

type Props = {
  short: ShortItem;
  height: number;
  /** This slide is on screen and the Shorts tab is focused. */
  active: boolean;
  /** Only slides near the visible one create a video player (saves memory). */
  mounted: boolean;
  muted: boolean;
  onToggleMute: () => void;
};

function ShortSlide({ short, height, active, mounted, muted, onToggleMute }: Props) {
  return (
    <View style={[styles.slide, { height }]}>
      {mounted ? (
        <ShortPlayer short={short} active={active} muted={muted} />
      ) : short.thumbnailUrl ? (
        <Image source={{ uri: short.thumbnailUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : null}
      <ShortOverlay short={short} muted={muted} onToggleMute={onToggleMute} />
    </View>
  );
}

export default memo(ShortSlide);

function ShortPlayer({ short, active, muted }: { short: ShortItem; active: boolean; muted: boolean }) {
  const [userPaused, setUserPaused] = useState(false);
  const viewed = useRef(false);

  const player = useVideoPlayer(publicStream(short.playbackId), (p) => {
    p.loop = true;
    p.muted = muted;
  });
  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: player.playing });

  useEffect(() => {
    player.muted = muted;
  }, [player, muted]);

  // Play the visible Short, pause and rewind the rest.
  useEffect(() => {
    if (active && !userPaused) player.play();
    else player.pause();
    if (!active) {
      player.currentTime = 0;
      setUserPaused(false);
    }
  }, [active, userPaused, player]);

  // Count a view once it has played for 2 seconds.
  useEffect(() => {
    if (!active || !isPlaying || viewed.current) return;
    const timer = setTimeout(() => {
      viewed.current = true;
      api(`/videos/${short.id}/view`, { method: "POST" }).catch(() => {});
    }, 2000);
    return () => clearTimeout(timer);
  }, [active, isPlaying, short.id]);

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={() => setUserPaused((p) => !p)} accessibilityLabel={isPlaying ? "Pause" : "Play"}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      {!isPlaying && userPaused ? (
        <View style={styles.paused} pointerEvents="none">
          <Play size={56} color="#fff" fill="#fff" />
        </View>
      ) : null}
    </Pressable>
  );
}

function ShortOverlay({ short, muted, onToggleMute }: { short: ShortItem; muted: boolean; onToggleMute: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [liked, setLiked] = useState(short.liked);
  const [likeCount, setLikeCount] = useState(short.likeCount);
  const [commentCount, setCommentCount] = useState(short.commentCount);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const menu = useContentMenu({
    report: { target: "VIDEO", id: short.id },
    block: short.isOwn ? undefined : { kind: "channel", id: short.channel.id, name: short.channel.name },
  });

  async function toggleLike() {
    const next = !liked;
    setLiked(next);
    setLikeCount((n) => Math.max(0, n + (next ? 1 : -1)));
    try {
      const result = await api<{ liked: boolean; likeCount: number }>(`/videos/${short.id}/like`, { method: "POST" });
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      setLiked(!next);
      setLikeCount((n) => Math.max(0, n + (next ? -1 : 1)));
    }
  }

  function share() {
    Share.share({ message: `${short.title} ${API_URL}/shorts/${short.id}` }).catch(() => {});
  }

  return (
    <>
      <Pressable style={[styles.mute, { top: insets.top + 8 }]} onPress={onToggleMute} hitSlop={10} accessibilityLabel={muted ? "Unmute" : "Mute"}>
        {muted ? <VolumeX size={20} color="#fff" /> : <Volume2 size={20} color="#fff" />}
      </Pressable>

      <View style={styles.info} pointerEvents="box-none">
        <View style={styles.channel}>
          <Pressable
            style={styles.channelLink}
            onPress={() => router.push({ pathname: "/channel/[handle]", params: { handle: short.channel.handle } })}
          >
            <Avatar name={short.channel.name} uri={short.channel.avatarUrl} size={32} />
            <Text style={styles.handle} numberOfLines={1}>
              @{short.channel.handle}
            </Text>
          </Pressable>
          <SubscribeButton channelId={short.channel.id} initialSubscribed={short.subscribed} isOwn={short.isOwn} size="sm" onDark />
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {short.title}
        </Text>
        {short.fullVideo ? (
          <Pressable
            style={styles.full}
            onPress={() => router.push({ pathname: "/watch/[id]", params: { id: short.fullVideo!.id } })}
            accessibilityRole="button"
          >
            <Play size={14} color="#0f0f0f" fill="#0f0f0f" />
            <Text style={styles.fullText} numberOfLines={1}>
              Watch full video · {short.fullVideo.title}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Action icon={<ThumbsUp size={26} color="#fff" fill={liked ? "#fff" : "transparent"} />} label={likeCount ? formatCount(likeCount) : "Like"} onPress={toggleLike} />
        <Action icon={<MessageSquareText size={26} color="#fff" />} label={commentCount ? formatCount(commentCount) : "Comment"} onPress={() => setCommentsOpen(true)} />
        <Action icon={<Share2 size={26} color="#fff" />} label="Share" onPress={share} />
        <Action icon={<EllipsisVertical size={26} color="#fff" />} label="More" onPress={menu.open} />
      </View>

      <CommentsSheet videoId={short.id} visible={commentsOpen} onClose={() => setCommentsOpen(false)} onCountChange={setCommentCount} />
      {menu.sheets}
    </>
  );
}

function Action({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.action} onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}>
      <View style={styles.actionIcon}>{icon}</View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const shadow = { textShadowColor: "rgba(0,0,0,0.6)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 };

const styles = StyleSheet.create({
  slide: { width: "100%", backgroundColor: "#000", overflow: "hidden" },
  paused: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.2)" },
  mute: { position: "absolute", top: 12, right: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
  info: { position: "absolute", left: 12, right: 84, bottom: 16, gap: 8 },
  channel: { flexDirection: "row", alignItems: "center", gap: 10 },
  channelLink: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  handle: { color: "#fff", fontWeight: "700", fontSize: 15, flexShrink: 1, ...shadow },
  title: { color: "#fff", fontSize: 15, lineHeight: 20, ...shadow },
  full: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", maxWidth: "100%", backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  fullText: { color: "#0f0f0f", fontWeight: "600", fontSize: 13, flexShrink: 1 },
  actions: { position: "absolute", right: 8, bottom: 16, gap: 18, alignItems: "center" },
  action: { alignItems: "center", gap: 4, width: 64 },
  actionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  actionLabel: { color: "#fff", fontSize: 12, fontWeight: "600", ...shadow },
});