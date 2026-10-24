// File: nesora-app/src/components/watch/WatchPlayer.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { HardDrive, Play, RotateCcw } from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatDuration, formatStorage } from "@/lib/format";
import { openOnWeb } from "@/lib/handoff";
import { publicStream, signedStream } from "@/lib/mux";
import type { ConsentResult, HeartbeatResult, PlaybackSource, StartResult } from "@/lib/types";

// The same flow as the website player (component/watch/WatchPlayer.tsx):
//   tap Play → free minute (or the trailer) → "Continue watching?" → Yes →
//   the full video plays and storage is charged every 15 s of real playback.
// Out of storage → "Top up on nesora.org" → back in the app it resumes where it stopped.

type Props = {
  videoId: string;
  posterUrl: string | null;
  durationSec: number | null;
  hasTrailer: boolean;
  isFree: boolean;
  freeSec: number;
  ratePerMinLabel: string;
  pricePerHourLabel: string;
  initialBalanceMicroMb: string;
};

type Stage = "idle" | "loading" | "preview" | "prompt" | "paid" | "free" | "insufficient" | "finished" | "error";

const TOKEN_REFRESH_MS = 90_000;

// Where each video was left off (this app session), so "Resume" works after a top-up.
const resumePositions = new Map<string, number>();

function sourceUrl(source: PlaybackSource) {
  return source.kind === "video" ? signedStream(source.playbackId, source.token) : publicStream(source.playbackId);
}

export default function WatchPlayer(props: Props) {
  const { videoId, posterUrl, durationSec, hasTrailer, isFree, freeSec } = props;
  const queryClient = useQueryClient();

  const [stage, setStage] = useState<Stage>("idle");
  const [balance, setBalance] = useState(props.initialBalanceMicroMb);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resumeAt, setResumeAt] = useState<number | null>(resumePositions.get(videoId) ?? null);

  const stageRef = useRef<Stage>("idle");
  const sessionId = useRef<string | null>(null);
  const mode = useRef<"FIRST_MINUTE" | "TRAILER" | null>(null);
  const seq = useRef(0);
  const played = useRef(0);
  const heartbeatSec = useRef(15);
  const tokenExpiresAt = useRef(0);

  const player = useVideoPlayer(null, (p) => {
    p.timeUpdateEventInterval = 0.5;
    p.staysActiveInBackground = false;
  });

  const go = useCallback((next: Stage) => {
    stageRef.current = next;
    setStage(next);
  }, []);

  // ---- session lifecycle -----------------------------------------------------

  const endSession = useCallback(() => {
    const id = sessionId.current;
    if (!id) return;
    sessionId.current = null;
    api("/playback/end", { method: "POST", body: { sessionId: id } }).catch(() => {});
  }, []);

  // Leaving the screen ends the session (unused prepaid seconds are refunded).
  useEffect(() => endSession, [endSession]);

  async function playSource(next: PlaybackSource, at: number) {
    if (next.kind === "video") tokenExpiresAt.current = next.tokenExpiresAt;
    await player.replaceAsync({ uri: sourceUrl(next) });
    if (at > 0) player.currentTime = at;
    player.play();
  }

  async function consent(at: number | null) {
    const id = sessionId.current;
    if (!id) return;
    setBusy(true);
    try {
      const result = await api<ConsentResult>("/playback/consent", { method: "POST", body: { sessionId: id } });
      if (result.state === "insufficient") {
        setBalance(result.balanceMicroMb);
        go("insufficient");
        return;
      }
      if (result.state === "ended") {
        setError("This session timed out. Tap play to start again.");
        go("error");
        return;
      }
      heartbeatSec.current = result.heartbeatSec;
      setBalance(result.balanceMicroMb);
      seq.current = 0;
      played.current = 0;
      go("paid");
      await playSource(result.source, at ?? result.startAt);
    } catch {
      setError("Couldn't continue. Check your connection and try again.");
      go("error");
    } finally {
      setBusy(false);
    }
  }

  async function start(options: { resumeFrom?: number } = {}) {
    go("loading");
    setError(null);
    try {
      const result = await api<StartResult>("/playback/start", { method: "POST", body: { videoId } });
      if (result.stage === "unavailable") {
        setError("This video isn't available right now.");
        go("error");
        return;
      }
      if (result.stage === "free") {
        go("free");
        await playSource(result.source, options.resumeFrom ?? 0);
        return;
      }
      sessionId.current = result.sessionId;
      mode.current = result.mode;

      // Back after topping up: skip the free part and continue where they were.
      if (options.resumeFrom) {
        await consent(options.resumeFrom);
        return;
      }
      go("preview");
      await playSource(result.source, 0);
    } catch {
      setError("Couldn't start the video. Check your connection and try again.");
      go("error");
    }
  }

  function declineContinue() {
    endSession();
    player.pause();
    go("finished");
  }

  async function resumeAfterTopUp() {
    const at = player.currentTime || resumeAt || null;
    if (sessionId.current) await consent(at);
    else void start({ resumeFrom: at ?? undefined });
  }

  function remember(seconds: number | null) {
    if (seconds && seconds > 0) resumePositions.set(videoId, Math.floor(seconds));
    else resumePositions.delete(videoId);
    setResumeAt(seconds && seconds > 0 ? Math.floor(seconds) : null);
  }

  // ---- playback events -----------------------------------------------------

  useEventListener(player, "timeUpdate", ({ currentTime }) => {
    // Backstop for the server-side clip: stop exactly at the end of the free minute.
    if (stageRef.current === "preview" && mode.current === "FIRST_MINUTE" && currentTime >= freeSec - 0.25) {
      player.pause();
      go("prompt");
    }
  });

  useEventListener(player, "playToEnd", () => {
    const s = stageRef.current;
    if (s === "preview") go("prompt");
    else if (s === "paid" || s === "free") {
      remember(null);
      endSession();
      go("finished");
    }
  });

  // Never charge in the background; when the app comes back from the website
  // (e.g. after buying storage), pick up automatically.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        player.pause();
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["me"] });
      if (stageRef.current === "insufficient") void resumeAfterTopUp();
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  // ---- metering: count real playback seconds, heartbeat every block ------------

  useEffect(() => {
    if (stage !== "paid") return;

    const tick = setInterval(() => {
      if (player.playing && player.status === "readyToPlay" && AppState.currentState === "active") played.current += 1;
    }, 1000);

    const beat = setInterval(async () => {
      const id = sessionId.current;
      if (!id) return;
      const playedSec = played.current;
      const needToken = tokenExpiresAt.current - Date.now() < TOKEN_REFRESH_MS;
      seq.current += 1;
      try {
        const result = await api<HeartbeatResult>("/playback/heartbeat", {
          method: "POST",
          body: { sessionId: id, seq: seq.current, playedSec, needToken },
        });
        played.current = Math.max(0, played.current - playedSec);

        if (result.state === "ok") {
          setBalance(result.balanceMicroMb);
          if (result.source) await playSource(result.source, player.currentTime); // fresh short-lived token
        } else if (result.state === "insufficient") {
          player.pause();
          setBalance(result.balanceMicroMb);
          remember(player.currentTime);
          go("insufficient");
        } else {
          // Session was settled (e.g. a long pause). Start a new one where we are.
          sessionId.current = null;
          void start({ resumeFrom: player.currentTime || undefined });
        }
      } catch {
        seq.current -= 1; // retry the same sequence number next time
      }
    }, heartbeatSec.current * 1000);

    return () => {
      clearInterval(tick);
      clearInterval(beat);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // ---- render ----------------------------------------------------------------

  const videoVisible = stage === "preview" || stage === "paid" || stage === "free" || stage === "prompt" || stage === "insufficient";
  const controls = stage === "preview" || stage === "paid" || stage === "free";

  return (
    // A 16:9 box is too short on phones for the prompt cards, so it grows while one shows.
    <View style={[styles.player, (stage === "prompt" || stage === "insufficient" || stage === "error") && styles.playerTall]}>
      {videoVisible ? (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          nativeControls={controls}
          fullscreenOptions={{ enable: controls }}
          allowsPictureInPicture={false}
        />
      ) : posterUrl ? (
        <Image source={{ uri: posterUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : null}

      {stage === "preview" ? (
        <View style={styles.badge} pointerEvents="none">
          <Text style={styles.badgeText}>{mode.current === "TRAILER" ? "Trailer · free" : `Free preview · ${formatDuration(freeSec)}`}</Text>
        </View>
      ) : null}

      {(stage === "idle" || stage === "loading" || stage === "finished") && (
        <View style={styles.overlay}>
          <Pressable
            onPress={() => start()}
            disabled={stage === "loading"}
            accessibilityRole="button"
            accessibilityLabel={stage === "finished" ? "Watch again" : "Play"}
            style={styles.play}
          >
            {stage === "loading" ? (
              <ActivityIndicator color="#fff" />
            ) : stage === "finished" ? (
              <RotateCcw size={30} color="#fff" />
            ) : (
              <Play size={32} color="#fff" fill="#fff" />
            )}
          </Pressable>
          <Text style={styles.hint}>
            {stage === "loading"
              ? "Loading…"
              : isFree
                ? `Free · ${formatDuration(durationSec)}`
                : hasTrailer
                  ? `Trailer first · ${formatDuration(durationSec)}`
                  : `First minute free · ${formatDuration(durationSec)}`}
          </Text>
          {stage === "idle" && resumeAt && !isFree ? (
            <Button title={`Resume from ${formatDuration(resumeAt)}`} size="sm" onPress={() => start({ resumeFrom: resumeAt })} />
          ) : null}
        </View>
      )}

      {stage === "prompt" && (
        <View style={[styles.overlay, styles.dim]} accessibilityViewIsModal>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Continue watching?</Text>
            <Text style={styles.cardText}>
              {mode.current === "TRAILER" ? "That was the trailer. " : "That was your free minute. "}
              The full video uses about {props.ratePerMinLabel} of storage per minute (around {props.pricePerHourLabel} an hour).
            </Text>
            <Balance value={balance} />
            <View style={styles.cardActions}>
              <Button title="Not now" onPress={declineContinue} disabled={busy} size="sm" />
              <Button title="Continue" variant="primary" onPress={() => consent(null)} loading={busy} size="sm" />
            </View>
          </View>
        </View>
      )}

      {stage === "insufficient" && (
        <View style={[styles.overlay, styles.dim]} accessibilityViewIsModal>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>You&apos;re out of storage</Text>
            <Text style={styles.cardText}>Top up on nesora.org to keep watching. You&apos;ll pick up right where you stopped.</Text>
            <Balance value={balance} />
            <View style={styles.cardActions}>
              <Button title="I've topped up" onPress={resumeAfterTopUp} disabled={busy} size="sm" />
              <Button
                title="Top up on nesora.org"
                variant="accent"
                size="sm"
                onPress={() => {
                  remember(player.currentTime);
                  openOnWeb("/storage");
                }}
              />
            </View>
          </View>
        </View>
      )}

      {stage === "error" && (
        <View style={[styles.overlay, styles.dim]}>
          <Text style={styles.error}>{error}</Text>
          <Button title="Try again" variant="primary" size="sm" onPress={() => start()} />
        </View>
      )}

    </View>
  );
}

function Balance({ value }: { value: string }) {
  return (
    <View style={styles.balance}>
      <HardDrive size={15} color="#e8834a" />
      <Text style={styles.balanceText}>You have {formatStorage(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  player: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000" },
  playerTall: { aspectRatio: undefined, minHeight: 300 },
  badge: { position: "absolute", left: 10, top: 10, backgroundColor: "rgba(0,0,0,0.65)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", gap: 10, padding: 16 },
  dim: { backgroundColor: "rgba(0,0,0,0.72)" },
  play: { width: 68, height: 68, borderRadius: 34, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
  hint: { color: "#fff", fontSize: 13, fontWeight: "600", textShadowColor: "rgba(0,0,0,0.7)", textShadowRadius: 3 },
  card: { width: "100%", maxWidth: 420, backgroundColor: "#212121", borderRadius: 14, padding: 14, gap: 8 },
  cardTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  cardText: { color: "#d0d0d0", fontSize: 13, lineHeight: 18 },
  balance: { flexDirection: "row", alignItems: "center", gap: 6 },
  balanceText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  cardActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 4 },
  error: { color: "#fff", textAlign: "center" },
});