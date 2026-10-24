// File: nesora-app/src/components/feed/SubscribeButton.tsx
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useTheme } from "@/theme/ThemeProvider";
import { radius } from "@/theme/colors";

type Props = { channelId: string; initialSubscribed: boolean; isOwn?: boolean; size?: "md" | "sm"; onDark?: boolean };

/** Free subscribe, like YouTube. Subscribed = alerts for new uploads. */
export default function SubscribeButton({ channelId, initialSubscribed, isOwn, size = "md", onDark }: Props) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [busy, setBusy] = useState(false);

  useEffect(() => setSubscribed(initialSubscribed), [initialSubscribed]);
  if (isOwn) return null;

  async function toggle() {
    const next = !subscribed;
    setSubscribed(next);
    setBusy(true);
    try {
      const result = await api<{ subscribed: boolean }>("/subscriptions", { method: "POST", body: { channelId } });
      setSubscribed(result.subscribed);
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    } catch {
      setSubscribed(!next);
    } finally {
      setBusy(false);
    }
  }

  const bg = subscribed ? (onDark ? "rgba(255,255,255,0.2)" : colors.chip) : onDark ? "#ffffff" : colors.inverseBg;
  const fg = subscribed ? (onDark ? "#ffffff" : colors.text) : onDark ? "#0f0f0f" : colors.inverseText;

  return (
    <Pressable
      onPress={toggle}
      disabled={busy}
      accessibilityRole="button"
      accessibilityState={{ selected: subscribed }}
      style={[styles.button, { backgroundColor: bg, height: size === "sm" ? 30 : 36, paddingHorizontal: size === "sm" ? 12 : 16 }]}
    >
      <Text style={[styles.label, { color: fg, fontSize: size === "sm" ? 13 : 14 }]}>{subscribed ? "Subscribed" : "Subscribe"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: radius.pill, justifyContent: "center" },
  label: { fontWeight: "600" },
});