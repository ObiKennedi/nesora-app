// File: nesora-app/src/hooks/use-comments.ts
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { CommentItem, CommentsPage } from "@/lib/types";

/** Loads, posts and deletes comments for a video (Shorts sheet and watch page). */
export function useComments(videoId: string, enabled: boolean, onCountChange?: (count: number) => void) {
  const [items, setItems] = useState<CommentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setCount = useCallback(
    (n: number) => {
      setTotal(n);
      onCountChange?.(n);
    },
    [onCountChange],
  );

  useEffect(() => {
    if (!enabled || loaded) return;
    setLoading(true);
    api<CommentsPage>(`/videos/${videoId}/comments`)
      .then((page) => {
        setItems(page.items);
        setCursor(page.nextCursor);
        setTotal(page.total);
        setLoaded(true);
      })
      .catch(() => setError("Couldn't load comments."))
      .finally(() => setLoading(false));
  }, [enabled, loaded, videoId]);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const page = await api<CommentsPage>(`/videos/${videoId}/comments`, { query: { cursor } });
      setItems((current) => [...current, ...page.items.filter((c) => !current.some((x) => x.id === c.id))]);
      setCursor(page.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  async function post(text: string) {
    setError(null);
    try {
      const { comment } = await api<{ comment: CommentItem }>(`/videos/${videoId}/comments`, { method: "POST", body: { body: text } });
      setItems((current) => [comment, ...current]);
      setCount(total + 1);
      return true;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't post your comment.");
      return false;
    }
  }

  async function remove(id: string) {
    const previous = items;
    setItems((current) => current.filter((c) => c.id !== id));
    try {
      await api(`/comments/${id}`, { method: "DELETE" });
      setCount(Math.max(0, total - 1));
    } catch {
      setItems(previous);
    }
  }

  function hideAuthor(authorId: string) {
    setItems((current) => current.filter((c) => c.author.id !== authorId));
  }

  return { items, total, loaded, loading, error, hasMore: Boolean(cursor), loadMore, post, remove, hideAuthor };
}