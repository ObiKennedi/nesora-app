// File: nesora-app/src/components/feed/VideoList.tsx
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet } from "react-native";
import VideoCard from "@/components/feed/VideoCard";
import type { FeedVideo } from "@/lib/types";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  videos: FeedVideo[];
  header?: React.ReactElement;
  empty?: React.ReactElement;
  loading?: boolean;
  loadingMore?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
};

/** A scrolling list of video cards with pull-to-refresh and infinite loading. */
export default function VideoList({ videos, header, empty, loading, loadingMore, refreshing, onRefresh, onEndReached }: Props) {
  const { colors } = useTheme();
  return (
    <FlatList
      data={videos}
      keyExtractor={(v) => v.id}
      renderItem={({ item }) => <VideoCard video={item} />}
      ListHeaderComponent={header}
      ListEmptyComponent={loading ? <ActivityIndicator style={styles.loading} color={colors.muted} /> : empty}
      ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.more} color={colors.muted} /> : undefined}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.6}
      refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.muted} /> : undefined}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: 64 },
  more: { marginVertical: 24 },
});