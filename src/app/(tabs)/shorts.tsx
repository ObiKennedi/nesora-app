// File: nesora-app/src/app/(tabs)/shorts.tsx
import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View, type ListViewToken } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import ShortSlide from "@/components/shorts/ShortSlide";
import { useShortsFeed } from "@/hooks/use-shorts-feed";
import type { ShortItem } from "@/lib/types";

// Full-screen vertical Shorts, one per swipe (like the website's /shorts).
export default function ShortsScreen() {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { start } = useLocalSearchParams<{ start?: string }>();
  const feed = useShortsFeed(start ?? null);
  const [height, setHeight] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const listRef = useRef<FlatList<ShortItem>>(null);

  const shorts = useMemo(() => {
    const seen = new Set<string>();
    return (feed.data?.pages.flatMap((p) => p.items) ?? []).filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));
  }, [feed.data]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ListViewToken[] }) => {
    const first = viewableItems.find((v) => v.isViewable);
    if (first?.index != null) setActiveIndex(first.index);
  }).current;

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  return (
    <View style={styles.root} onLayout={(e) => setHeight(Math.round(e.nativeEvent.layout.height))}>
      {focused ? <StatusBar style="light" /> : null}
      {height > 0 && (
        <FlatList
          ref={listRef}
          data={shorts}
          keyExtractor={(s) => s.id}
          renderItem={({ item, index }) => (
            <ShortSlide
              short={item}
              height={height}
              active={focused && index === activeIndex}
              mounted={Math.abs(index - activeIndex) <= 1}
              muted={muted}
              onToggleMute={toggleMute}
            />
          )}
          pagingEnabled
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
          onEndReached={() => feed.hasNextPage && !feed.isFetchingNextPage && feed.fetchNextPage()}
          onEndReachedThreshold={2}
          windowSize={3}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          contentContainerStyle={{ paddingTop: 0 }}
          ListEmptyComponent={
            <View style={[styles.center, { height, paddingTop: insets.top }]}>
              {feed.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : feed.isError ? (
                <Text style={styles.emptyText} onPress={() => feed.refetch()}>
                  Couldn&apos;t load Shorts. Tap to try again.
                </Text>
              ) : (
                <Text style={styles.emptyText}>No Shorts yet.</Text>
              )}
            </View>
          }
        />
      )}
      <View style={[styles.topFade, { height: insets.top }]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  center: { alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#fff", fontSize: 16 },
  topFade: { position: "absolute", top: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.25)" },
});