// File: nesora-app/src/hooks/use-push.ts
import { useEffect } from "react";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { registerForPush } from "@/lib/push";

/** Registers this phone for upload alerts and opens the video when one is tapped. */
export function usePush(enabled: boolean = true) {
  const router = useRouter();
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (enabled) void registerForPush();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const data = lastResponse?.notification.request.content.data as { videoId?: string; kind?: string } | undefined;
    if (!data?.videoId) return;
    if (data.kind === "SHORT") router.push({ pathname: "/shorts", params: { start: data.videoId } });
    else router.push({ pathname: "/watch/[id]", params: { id: data.videoId } });
  }, [enabled, lastResponse, router]);
}
