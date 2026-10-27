// File: nesora-app/src/hooks/use-shorts-feed.ts
import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Page, ShortItem } from "@/lib/types";

/** Vertical Shorts feed. `start` pins a specific Short to the top (from a shelf or link). `category` filters by category. */
export function useShortsFeed(start: string | null, category?: string | null) {
  return useInfiniteQuery({
    queryKey: ["shorts", start, category ?? null],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      api<Page<ShortItem>>("/feed/shorts", {
        query: { offset: pageParam, start, category: category ?? undefined },
      }),
    getNextPageParam: (last) => last.nextOffset ?? undefined,
  });
}