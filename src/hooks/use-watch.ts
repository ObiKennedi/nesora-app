// File: nesora-app/src/hooks/use-watch.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { FeedVideo, WatchResponse } from "@/lib/types";

export function useWatchVideo(id: string) {
  return useQuery({ queryKey: ["watch", id], queryFn: () => api<WatchResponse>(`/videos/${id}`) });
}

export function useUpNext(id: string) {
  return useQuery({
    queryKey: ["up-next", id],
    queryFn: async () => (await api<{ videos: FeedVideo[] }>(`/videos/${id}/up-next`)).videos,
    staleTime: 5 * 60_000,
  });
}