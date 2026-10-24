// File: nesora-app/src/hooks/use-shorts-feed.ts
import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Page, ShortItem } from "@/lib/types";

/** Vertical Shorts feed. `start` pins a specific Short to the top (from a shelf or link). */
export function useShortsFeed(start: string | null) {
  return useInfiniteQuery({
    queryKey: ["shorts", start],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => api<Page<ShortItem>>("/feed/shorts", { query: { offset: pageParam, start } }),
    getNextPageParam: (last) => last.nextOffset ?? undefined,
  });
}