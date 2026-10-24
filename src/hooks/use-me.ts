// File: nesora-app/src/hooks/use-me.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Me } from "@/lib/types";

/** The signed-in user, storage balance and unread count. Refetched when the app comes back to the foreground. */
export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: () => api<Me>("/me") });
}