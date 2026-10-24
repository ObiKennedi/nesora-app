// File: nesora-app/src/app/search.tsx
import { useMemo, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { Stack } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import ShortsShelf from "@/components/feed/ShortsShelf";
import VideoList from "@/components/feed/VideoList";
import EmptyState from "@/components/feedback/EmptyState";
import { api } from "@/lib/api";
import type { SearchResponse } from "@/lib/types";
import { useTheme } from "@/theme/ThemeProvider";
import { radius } from "@/theme/colors";

export default function SearchScreen() {
  const { colors } = useTheme();
  const [text, setText] = useState("");
  const [q, setQ] = useState("");

  const results = useInfiniteQuery({
    queryKey: ["search", q],
    enabled: q.length > 0,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => api<SearchResponse>("/search", { query: { q, offset: pageParam } }),
    getNextPageParam: (last) => last.videos.nextOffset ?? undefined,
  });

  const videos = useMemo(() => results.data?.pages.flatMap((p) => p.videos.items) ?? [], [results.data]);
  const shorts = results.data?.pages[0]?.shorts ?? [];

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <TextInput
              value={text}
              onChangeText={setText}
              onSubmitEditing={() => setQ(text.trim())}
              placeholder="Search Nesora"
              placeholderTextColor={colors.muted}
              returnKeyType="search"
              autoFocus
              autoCorrect={false}
              style={[styles.input, { color: colors.text, backgroundColor: colors.chip }]}
            />
          ),
        }}
      />
      <VideoList
        videos={videos}
        loading={q.length > 0 && results.isPending}
        loadingMore={results.isFetchingNextPage}
        onEndReached={() => results.hasNextPage && !results.isFetchingNextPage && results.fetchNextPage()}
        header={shorts.length ? <View style={{ paddingTop: 12 }}><ShortsShelf shorts={shorts} /></View> : undefined}
        empty={
          q ? (
            <EmptyState title="No results" text={`Nothing matched “${q}”. Try different words.`} />
          ) : (
            <EmptyState title="Search Nesora" text="Find videos and creators by name." />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  input: { width: 260, height: 38, borderRadius: radius.pill, paddingHorizontal: 14, fontSize: 15 },
});