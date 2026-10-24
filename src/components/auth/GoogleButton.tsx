// File: nesora-app/src/components/auth/GoogleButton.tsx
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { useTheme } from "@/theme/ThemeProvider";
import { radius } from "@/theme/colors";

/**
 * Google sign-in opens the system browser and comes back to nesora://.
 * Needs a development or store build — Expo Go can't receive the nesora:// link.
 */
export default function GoogleButton() {
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);

  async function handlePress() {
    setBusy(true);
    try {
      const { error } = await authClient.signIn.social({ provider: "google", callbackURL: "/" });
      if (error) Alert.alert("Couldn't sign in with Google", authErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={busy}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { borderColor: colors.border, backgroundColor: colors.inputBg, opacity: busy ? 0.6 : pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.g}>
        <Text style={styles.gText}>G</Text>
      </View>
      <Text style={[styles.label, { color: colors.text }]}>{busy ? "Opening Google…" : "Continue with Google"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  g: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  gText: { color: "#4285F4", fontWeight: "800", fontSize: 14 },
  label: { fontSize: 15, fontWeight: "600" },
});