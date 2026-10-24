// File: nesora-app/src/hooks/use-home-feed.ts
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Category, HomeResponse } from "@/lib/types";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api<{ categories: Category[] }>("/categories")).categories,
    staleTime: 10 * 60_000,
  });
}

/** Home feed for a category (null = All). Pages of long videos; page 1 carries the Shorts shelf. */
export function useHomeFeed(category: string | null) {
  return useInfiniteQuery({
    queryKey: ["home", category],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => api<HomeResponse>("/feed/home", { query: { category, offset: pageParam } }),
    getNextPageParam: (last) => last.videos.nextOffset ?? undefined,
  });
}