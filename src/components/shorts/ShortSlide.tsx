// File: nesora-app/src/components/shorts/ShortSlide.tsx
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Dimensions, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useEvent } from "expo";
import { useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { EllipsisVertical, MessageSquareText, Play, RotateCcw, RotateCw, Share2, ThumbsUp, Volume2, VolumeX } from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";
import CommentsSheet from "@/components/comments/CommentsSheet";
import SubscribeButton from "@/components/feed/SubscribeButton";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { useContentMenu } from "@/hooks/use-content-menu";
import { api } from "@/lib/api";
import { API_URL } from "@/lib/config";
import { formatCount, formatStorage } from "@/lib/format";
import { openOnWeb } from "@/lib/handoff";
import { publicStream } from "@/lib/mux";
import type { ConsentResult, HeartbeatResult, Me, ShortItem, StartResult } from "@/lib/types";

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
      {/* Thumbnail stays in the background so there is never a black flash or void while the video loads */}
      {short.thumbnailUrl ? (
        <Image source={{ uri: short.thumbnailUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : null}
      {mounted ? (
        <ShortPlayer short={short} active={active} muted={muted} />
      ) : null}
      <ShortOverlay short={short} muted={muted} onToggleMute={onToggleMute} />
    </View>
  );
}

export default memo(ShortSlide);

function ShortPlayer({ short, active, muted }: { short: ShortItem; active: boolean; muted: boolean }) {
  const queryClient = useQueryClient();
  const [userPaused, setUserPaused] = useState(false);
  const [insufficient, setInsufficient] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  const viewed = useRef(false);
  // Scrubber & Double-tap Seek state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekBadge, setSeekBadge] = useState<null | { dir: "rewind" | "forward"; seconds: number }>(null);
  const seekTimer = useRef<NodeJS.Timeout | null>(null);
  const lastTapTime = useRef(0);
  const singleTapTimer = useRef<NodeJS.Timeout | null>(null);

  const seekBy = useCallback((seconds: number) => {
    try {
      player.seekBy(seconds);
    } catch {
      const dur = player.duration || 60;
      const next = Math.max(0, Math.min(dur, player.currentTime + seconds));
      player.currentTime = next;
    }
    const dur = player.duration || 60;
    const next = Math.max(0, Math.min(dur, player.currentTime + seconds));
    setCurrentTime(next);
    setSeekBadge((prev) => ({
      dir: seconds > 0 ? "forward" : "rewind",
      seconds: prev && prev.dir === (seconds > 0 ? "forward" : "rewind") ? prev.seconds + Math.abs(seconds) : Math.abs(seconds),
    }));
    if (seekTimer.current) clearTimeout(seekTimer.current);
    seekTimer.current = setTimeout(() => setSeekBadge(null), 800);
  }, [player]);

  const handlePress = useCallback((e: any) => {
    if (insufficient) return;
    const now = Date.now();
    const screenWidth = Dimensions.get("window").width || 380;
    const x = e.nativeEvent?.pageX ?? e.nativeEvent?.locationX ?? (screenWidth / 2);
    const diff = now - lastTapTime.current;

    if (diff > 40 && diff < 420) {
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
        singleTapTimer.current = null;
      }
      lastTapTime.current = 0;
      if (x < screenWidth * 0.42) {
        seekBy(-10);
      } else if (x > screenWidth * 0.58) {
        seekBy(10);
      } else {
        seekBy(10);
      }
    } else {
      lastTapTime.current = now;
      if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
      singleTapTimer.current = setTimeout(() => {
        setUserPaused((p) => !p);
        singleTapTimer.current = null;
      }, 300);
    }
  }, [insufficient, seekBy]);


  // Metering session state
  const sessionId = useRef<string | null>(null);
  const stage = useRef<"idle" | "loading" | "free" | "preview" | "paid" | "insufficient">("idle");
  const playedSec = useRef(0);
  const seq = useRef(0);

  const player = useVideoPlayer(publicStream(short.playbackId), (p) => {
    p.loop = true;
    p.muted = muted;
    p.staysActiveInBackground = true;
    if (active) p.play();
  });
  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: player.playing });
  const { status } = useEvent(player, "statusChange", { status: player.status });

  const updateBalance = useCallback(
    (newBalance: string) => {
      queryClient.setQueryData<Me>(["me"], (old) => {
        if (!old) return old;
        return {
          ...old,
          storage: {
            balanceMicroMb: newBalance,
            label: formatStorage(newBalance),
          },
        };
      });
      queryClient.invalidateQueries({ queryKey: ["storage"] });
    },
    [queryClient],
  );

  useEffect(() => {
    if (isPlaying) setHasRendered(true);
  }, [isPlaying]);

  useEffect(() => {
    if (!active) setHasRendered(false);
  }, [active]);

  useEffect(() => {
    player.muted = muted;
  }, [player, muted]);

  // Session lifecycle when active / inactive
  useEffect(() => {
    if (!active) {
      if (sessionId.current) {
        const id = sessionId.current;
        sessionId.current = null;
        api("/playback/end", { method: "POST", body: { sessionId: id } }).catch(() => {});
      }
      stage.current = "idle";
      playedSec.current = 0;
      seq.current = 0;
      setInsufficient(false);
      return;
    }

    let cancelled = false;
    async function initSession() {
      try {
        const res = await api<StartResult>("/playback/start", { method: "POST", body: { videoId: short.id } });
        if (cancelled) return;
        if (res.stage === "free") {
          stage.current = "free";
          return;
        }
        if (res.stage === "preview") {
          stage.current = "preview";
          sessionId.current = res.sessionId;
        }
      } catch {
        // network fallback
      }
    }
    void initSession();

    return () => {
      cancelled = true;
      if (sessionId.current) {
        const id = sessionId.current;
        sessionId.current = null;
        api("/playback/end", { method: "POST", body: { sessionId: id } }).catch(() => {});
      }
      stage.current = "idle";
      playedSec.current = 0;
      seq.current = 0;
    };
  }, [active, short.id]);

  // Play the visible Short, pause and rewind the rest.
  useEffect(() => {
    if (active && !userPaused && !insufficient) player.play();
    else player.pause();
    if (!active) {
      player.currentTime = 0;
      setUserPaused(false);
    }
  }, [active, userPaused, insufficient, player]);

  // When player finishes buffering and is ready, trigger playback if active
  useEffect(() => {
    if (active && !userPaused && !insufficient && status === "readyToPlay" && !player.playing) {
      player.play();
    }
  }, [active, userPaused, insufficient, status, player]);

  // Track playback time: first 60 seconds are free without notification.
  // After 60 seconds, 0.01 MB/min calculates seamlessly in the background.
  useEffect(() => {
    if (!active) return;

    const timer = setInterval(async () => {
      if (!player.playing) return;
      playedSec.current += 1;
      setCurrentTime(player.currentTime);
      if (player.duration) setDuration(player.duration);

      if (stage.current === "preview" && playedSec.current >= 60) {
        const id = sessionId.current;
        if (!id) return;
        stage.current = "loading";
        try {
          const res = await api<ConsentResult>("/playback/consent", { method: "POST", body: { sessionId: id } });
          if (res.state === "ok") {
            stage.current = "paid";
            updateBalance(res.balanceMicroMb);
          } else if (res.state === "insufficient") {
            stage.current = "insufficient";
            player.pause();
            setInsufficient(true);
            updateBalance(res.balanceMicroMb);
          } else {
            stage.current = "idle";
          }
        } catch {
          stage.current = "preview";
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [active, player, updateBalance]);

  // Heartbeat loop every 15 seconds while stage is "paid" (0.01 MB / min)
  useEffect(() => {
    if (!active) return;

    const beatTimer = setInterval(async () => {
      if (stage.current !== "paid") return;
      const id = sessionId.current;
      if (!id || !player.playing) return;

      seq.current += 1;
      try {
        const res = await api<HeartbeatResult>("/playback/heartbeat", {
          method: "POST",
          body: {
            sessionId: id,
            seq: seq.current,
            playedSec: 15,
            needToken: false,
          },
        });

        if (res.state === "ok") {
          updateBalance(res.balanceMicroMb);
        } else if (res.state === "insufficient") {
          stage.current = "insufficient";
          player.pause();
          setInsufficient(true);
          updateBalance(res.balanceMicroMb);
        }
      } catch {
        seq.current -= 1;
      }
    }, 15000);

    return () => clearInterval(beatTimer);
  }, [active, player, updateBalance]);

  // Handle app lifecycle: ensure playing resumes if foregrounded
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        if (active && !userPaused && !insufficient && !player.playing) player.play();
      }
    });
    return () => sub.remove();
  }, [active, userPaused, insufficient, player]);

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
    <Pressable
      style={StyleSheet.absoluteFill}
      onPress={handlePress}
      accessibilityLabel={isPlaying ? "Pause" : "Play"}
    >
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        surfaceType="textureView"
      />
      {short.thumbnailUrl && !hasRendered ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Image source={{ uri: short.thumbnailUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        </View>
      ) : null}
      {!isPlaying && !userPaused && active && status === "loading" ? (
        <View style={styles.loadingCenter} pointerEvents="none">
          <ActivityIndicator color="#fff" size="small" />
        </View>
      ) : null}
      {!isPlaying && userPaused && !insufficient ? (
        <View style={styles.pausedControls} pointerEvents="box-none">
          <Pressable style={styles.pausedBtn} onPress={() => seekBy(-10)} hitSlop={12} accessibilityLabel="Rewind 10 seconds">
            <RotateCcw size={22} color="#fff" />
            <Text style={styles.pausedBtnText}>10s</Text>
          </Pressable>
          <Pressable style={styles.pausedBtnMain} onPress={() => setUserPaused(false)} hitSlop={12} accessibilityLabel="Play">
            <Play size={40} color="#fff" fill="#fff" />
          </Pressable>
          <Pressable style={styles.pausedBtn} onPress={() => seekBy(10)} hitSlop={12} accessibilityLabel="Fast forward 10 seconds">
            <RotateCw size={22} color="#fff" />
            <Text style={styles.pausedBtnText}>10s</Text>
          </Pressable>
        </View>
      ) : null}
      {insufficient ? (
        <View style={styles.insufficientOverlay}>
          <Text style={styles.insufficientTitle}>Out of storage space</Text>
          <Text style={styles.insufficientSub}>Top up on nesora.org to keep watching.</Text>
          <Button
            title="Buy storage on nesora.org"
            variant="accent"
            size="sm"
            onPress={() => openOnWeb("/storage")}
            style={{ marginTop: 8 }}
          />
        </View>
      ) : null}
      {/* Double-tap Seek Feedback */}
      {seekBadge ? (
        <View style={[styles.seekBadge, seekBadge.dir === "rewind" ? styles.seekBadgeLeft : styles.seekBadgeRight]} pointerEvents="none">
          {seekBadge.dir === "rewind" ? <RotateCcw size={28} color="#fff" /> : <RotateCw size={28} color="#fff" />}
          <Text style={styles.seekBadgeText}>{seekBadge.seconds}s</Text>
        </View>
      ) : null}

      {/* Progress / Scrubber Bar at Bottom */}
      <View
        style={styles.scrubberBar}
        onTouchStart={(e) => {
          const screenWidth = Dimensions.get("window").width || 380;
          const x = e.nativeEvent.pageX ?? e.nativeEvent.locationX;
          const ratio = Math.max(0, Math.min(1, x / screenWidth));
          const dur = player.duration || duration || 60;
          const target = ratio * dur;
          try { player.seekBy(target - player.currentTime); } catch { player.currentTime = target; }
          setCurrentTime(target);
        }}
        onTouchMove={(e) => {
          const screenWidth = Dimensions.get("window").width || 380;
          const x = e.nativeEvent.pageX ?? e.nativeEvent.locationX;
          const ratio = Math.max(0, Math.min(1, x / screenWidth));
          const dur = player.duration || duration || 60;
          const target = ratio * dur;
          try { player.seekBy(target - player.currentTime); } catch { player.currentTime = target; }
          setCurrentTime(target);
        }}
      >
        <View style={styles.scrubberTrack}>
          <View style={[styles.scrubberFill, { width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }]} />
        </View>
      </View>
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
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)));
    try {
      const result = await api<{ liked: boolean; likeCount: number }>(`/videos/${short.id}/like`, { method: "POST" });
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      setLiked(!next);
      setLikeCount((c) => Math.max(0, c + (next ? -1 : 1)));
    }
  }

  const openChannel = () => router.push({ pathname: "/channel/[handle]", params: { handle: short.channel.handle } });

  return (
    <>
      <Pressable onPress={onToggleMute} style={[styles.mute, { top: insets.top + 12 }]} accessibilityRole="button" accessibilityLabel={muted ? "Unmute" : "Mute"}>
        {muted ? <VolumeX size={20} color="#fff" /> : <Volume2 size={20} color="#fff" />}
      </Pressable>

      <View style={[styles.info, { bottom: insets.bottom + 16 }]}>
        <View style={styles.channel}>
          <Pressable onPress={openChannel} style={styles.channelLink} accessibilityRole="button">
            <Avatar name={short.channel.name} uri={short.channel.avatarUrl} size={32} />
            <Text style={styles.handle} numberOfLines={1}>
              @{short.channel.handle}
            </Text>
          </Pressable>
          <SubscribeButton channelId={short.channel.id} initialSubscribed={short.subscribed} isOwn={short.isOwn} size="sm" />
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {short.title}
        </Text>

        {short.fullVideo ? (
          <Pressable
            onPress={() => router.push({ pathname: "/watch/[id]", params: { id: short.fullVideo!.id } })}
            style={styles.full}
            accessibilityRole="button"
          >
            <Play size={12} color="#0f0f0f" fill="#0f0f0f" />
            <Text style={styles.fullText} numberOfLines={1}>
              Watch full video · {short.fullVideo.title}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.actions, { bottom: insets.bottom + 16 }]}>
        <Action
          icon={<ThumbsUp size={24} color={liked ? "#f59e0b" : "#fff"} fill={liked ? "#f59e0b" : "transparent"} />}
          label={likeCount ? formatCount(likeCount) : "Like"}
          onPress={toggleLike}
        />
        <Action icon={<MessageSquareText size={24} color="#fff" />} label={commentCount ? formatCount(commentCount) : "Comment"} onPress={() => setCommentsOpen(true)} />
        <Action icon={<Share2 size={24} color="#fff" />} label="Share" onPress={() => Share.share({ message: `${short.title} ${API_URL}/shorts/${short.id}` }).catch(() => {})} />
        <Action icon={<EllipsisVertical size={24} color="#fff" />} label="" onPress={menu.open} />
      </View>

      <CommentsSheet videoId={short.id} visible={commentsOpen} onClose={() => setCommentsOpen(false)} onCountChange={setCommentCount} />
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
  pausedControls: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 20,
  },
  pausedBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  pausedBtnMain: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 4,
  },
  pausedBtnText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  loadingCenter: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  insufficientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 20,
  },
  insufficientTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  insufficientSub: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
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
  scrubberBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 16,
    justifyContent: "flex-end",
    zIndex: 25,
  },
  scrubberTrack: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  scrubberFill: {
    height: "100%",
    backgroundColor: "#c2622a",
  },
  seekBadge: {
    position: "absolute",
    top: "50%",
    marginTop: -38,
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 35,
  },
  seekBadgeLeft: {
    left: 40,
  },
  seekBadgeRight: {
    right: 40,
  },
  seekBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
});
