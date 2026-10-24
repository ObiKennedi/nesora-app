// File: nesora-app/src/app/watch/[id].tsx
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronDown } from "lucide-react-native";
import VideoCard from "@/components/feed/VideoCard";
import EmptyState from "@/components/feedback/EmptyState";
import WatchDetails from "@/components/watch/WatchDetails";
import WatchPlayer from "@/components/watch/WatchPlayer";
import { useUpNext, useWatchVideo } from "@/hooks/use-watch";
import { ApiError } from "@/lib/api";
import { useTheme } from "@/theme/ThemeProvider";

// Player pinned at the top (like YouTube), details and Up next scroll below it.
export default function WatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const watch = useWatchVideo(id);
  const upNext = useUpNext(id);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style="light" />
      <View style={{ height: insets.top, backgroundColor: "#000" }} />

      {watch.data ? (
        <WatchPlayer
          key={id}
          videoId={id}
          posterUrl={watch.data.video.thumbnailUrl}
          durationSec={watch.data.video.durationSec}
          hasTrailer={watch.data.video.hasTrailer}
          isFree={watch.data.pricing.isFree}
          freeSec={watch.data.pricing.freePreviewSec}
          ratePerMinLabel={watch.data.pricing.ratePerMinLabel}
          pricePerHourLabel={watch.data.pricing.pricePerHourLabel}
          initialBalanceMicroMb={watch.data.storage.balanceMicroMb}
        />
      ) : (
        <View style={styles.playerPlaceholder}>{watch.isPending ? <ActivityIndicator color="#fff" /> : null}</View>
      )}

      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        style={[styles.back, { top: insets.top + 6 }]}
        accessibilityRole="button"
        accessibilityLabel="Close"
        hitSlop={8}
      >
        <ChevronDown size={24} color="#fff" />
      </Pressable>

      {watch.isError ? (
        <EmptyState
          title="This video isn't available"
          text={watch.error instanceof ApiError ? watch.error.message : "Check your connection and try again."}
          action={{ label: "Go back", onPress: () => (router.canGoBack() ? router.back() : router.replace("/")) }}
        />
      ) : (
        <FlatList
          data={upNext.data ?? []}
          keyExtractor={(v) => v.id}
          renderItem={({ item }) => <VideoCard video={item} replace />}
          ListHeaderComponent={
            watch.data ? (
              <>
                <WatchDetails video={watch.data.video} />
                {upNext.data?.length ? <Text style={[styles.upNext, { color: colors.text }]}>Up next</Text> : null}
              </>
            ) : undefined
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  playerPlaceholder: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  back: { position: "absolute", left: 8, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  upNext: { fontSize: 16, fontWeight: "700", paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12 },
});