// File: nesora-app/src/app/(tabs)/shorts.tsx
import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, StyleSheet, Text, View, type ListViewToken } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import CategoryChips from "@/components/feed/CategoryChips";
import ShortSlide from "@/components/shorts/ShortSlide";
import { useCategories } from "@/hooks/use-home-feed";
import { useShortsFeed } from "@/hooks/use-shorts-feed";
import type { ShortItem } from "@/lib/types";

// Full-screen vertical Shorts, one per swipe (like the website's /shorts).
export default function ShortsScreen() {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { start } = useLocalSearchParams<{ start?: string }>();
  const [category, setCategory] = useState<string | null>(null);
  const categories = useCategories();
  const feed = useShortsFeed(start ?? null, category);
  const [height, setHeight] = useState(() => Math.round(Dimensions.get("window").height));
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

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 0,
  }).current;

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  const handleSelectCategory = useCallback((slug: string | null) => {
    setCategory(slug);
    setActiveIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: ShortItem; index: number }) => (
      <ShortSlide
        short={item}
        height={height}
        active={focused && index === activeIndex}
        mounted={Math.abs(index - activeIndex) <= 1}
        muted={muted}
        onToggleMute={toggleMute}
      />
    ),
    [focused, activeIndex, height, muted, toggleMute],
  );

  return (
    <View style={styles.root} onLayout={(e) => setHeight(Math.round(e.nativeEvent.layout.height))}>
      {focused ? <StatusBar style="light" /> : null}
      {height > 0 && (
        <FlatList
          ref={listRef}
          data={shorts}
          keyExtractor={(s) => s.id}
          renderItem={renderItem}
          pagingEnabled
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onEndReached={() => feed.hasNextPage && !feed.isFetchingNextPage && feed.fetchNextPage()}
          onEndReachedThreshold={2}
          windowSize={5}
          initialNumToRender={2}
          maxToRenderPerBatch={3}
          removeClippedSubviews={false}
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
                <Text style={styles.emptyText}>No Shorts yet in this category.</Text>
              )}
            </View>
          }
        />
      )}
      <View style={[styles.topFade, { height: insets.top + 50 }]} pointerEvents="none" />
      {categories.data && categories.data.length > 0 && (
        <View style={[styles.floatingChips, { top: insets.top + 4 }]}>
          <CategoryChips
            categories={categories.data}
            selected={category}
            onSelect={handleSelectCategory}
            onDark
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  center: { alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#fff", fontSize: 16 },
  topFade: { position: "absolute", top: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.35)" },
  floatingChips: { position: "absolute", left: 0, right: 0, zIndex: 10 },
});