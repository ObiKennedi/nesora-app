// File: nesora-app/src/app/(auth)/forgot-password.tsx
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Link } from "expo-router";
import AuthScreen from "@/components/auth/AuthScreen";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { API_URL } from "@/lib/config";
import { useTheme } from "@/theme/ThemeProvider";

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim()) return setError("Enter your email.");
    setBusy(true);
    setError(null);
    // The reset link opens the website's reset page; afterwards they log in here.
    const { error: err } = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: `${API_URL}/reset-password`,
    });
    setBusy(false);
    if (err) setError(authErrorMessage(err));
    else setSent(true);
  }

  return (
    <AuthScreen
      title="Reset your password"
      subtitle={sent ? undefined : "Enter your email and we'll send you a link to choose a new password."}
      footer={
        <Link href="/login" style={[styles.link, { color: colors.accent }]}>
          Back to log in
        </Link>
      }
    >
      {sent ? (
        <Text style={[styles.sent, { color: colors.text }]}>
          If an account exists for {email.trim()}, a reset link is on its way. Open it, choose a new password, then log in here.
        </Text>
      ) : (
        <>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            returnKeyType="send"
            onSubmitEditing={submit}
          />
          {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
          <Button title="Send reset link" variant="primary" size="lg" fullWidth loading={busy} onPress={submit} />
        </>
      )}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  link: { fontWeight: "600" },
  sent: { fontSize: 15, lineHeight: 22 },
});