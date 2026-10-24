// File: nesora-app/src/app/(tabs)/index.tsx
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import AppHeader from "@/components/AppHeader";
import CategoryChips from "@/components/feed/CategoryChips";
import InterestsModal from "@/components/feed/InterestsModal";
import ShortsShelf from "@/components/feed/ShortsShelf";
import VideoCard from "@/components/feed/VideoCard";
import EmptyState from "@/components/feedback/EmptyState";
import { useCategories, useHomeFeed } from "@/hooks/use-home-feed";
import { useMe } from "@/hooks/use-me";
import { ApiError } from "@/lib/api";
import type { FeedVideo, ShortCard } from "@/lib/types";
import { useTheme } from "@/theme/ThemeProvider";

type Row = { type: "video"; video: FeedVideo } | { type: "shelf"; shorts: ShortCard[] };

const SHELF_AFTER = 3; // the Shorts shelf sits after the third video, like the website

export default function HomeScreen() {
  const { colors } = useTheme();
  const [category, setCategory] = useState<string | null>(null);
  const { data: me } = useMe();
  const categories = useCategories();
  const feed = useHomeFeed(category);

  const rows = useMemo<Row[]>(() => {
    const videos = feed.data?.pages.flatMap((p) => p.videos.items) ?? [];
    const shorts = feed.data?.pages[0]?.shorts ?? [];
    const out: Row[] = videos.map((video) => ({ type: "video", video }));
    if (shorts.length) out.splice(Math.min(SHELF_AFTER, out.length), 0, { type: "shelf", shorts });
    return out;
  }, [feed.data]);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <AppHeader />
      <FlatList
        data={rows}
        keyExtractor={(row) => (row.type === "video" ? row.video.id : "shelf")}
        renderItem={({ item }) => (item.type === "video" ? <VideoCard video={item.video} /> : <ShortsShelf shorts={item.shorts} />)}
        ListHeaderComponent={
          categories.data?.length ? (
            <View style={{ backgroundColor: colors.bg }}>
              <CategoryChips categories={categories.data} selected={category} onSelect={setCategory} />
            </View>
          ) : undefined
        }
        stickyHeaderIndices={categories.data?.length ? [0] : undefined}
        onEndReached={() => feed.hasNextPage && !feed.isFetchingNextPage && feed.fetchNextPage()}
        onEndReachedThreshold={0.6}
        refreshControl={
          <RefreshControl refreshing={feed.isRefetching && !feed.isFetchingNextPage} onRefresh={() => void feed.refetch()} tintColor={colors.muted} />
        }
        ListEmptyComponent={
          feed.isPending ? (
            <ActivityIndicator style={styles.loading} color={colors.muted} />
          ) : feed.isError ? (
            <EmptyState title="Couldn't load videos" text={feed.error instanceof ApiError ? feed.error.message : "Check your connection and try again."} action={{ label: "Try again", onPress: () => feed.refetch() }} />
          ) : (
            <EmptyState
              title={category ? "Nothing here yet" : "No videos yet"}
              text={category ? "No videos in this category yet. Try another one." : "When creators publish, their videos show up here."}
            />
          )
        }
        ListFooterComponent={feed.isFetchingNextPage ? <ActivityIndicator style={styles.more} color={colors.muted} /> : undefined}
        removeClippedSubviews
        windowSize={7}
      />
      <InterestsModal visible={Boolean(me?.showInterestsPicker && categories.data?.length)} categories={categories.data ?? []} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { marginTop: 64 },
  more: { marginVertical: 24 },
});