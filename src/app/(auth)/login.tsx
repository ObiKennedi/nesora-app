// File: nesora-app/src/app/(auth)/login.tsx
import { useRef, useState } from "react";
import { StyleSheet, Text, type TextInputInstance } from "react-native";
import { Link } from "expo-router";
import AuthScreen from "@/components/auth/AuthScreen";
import Divider from "@/components/auth/Divider";
import GoogleButton from "@/components/auth/GoogleButton";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { API_URL } from "@/lib/config";
import { useTheme } from "@/theme/ThemeProvider";

export default function LoginScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<TextInputInstance>(null);

  async function submit() {
    if (!email.trim() || !password) return setError("Enter your email and password.");
    setBusy(true);
    setError(null);
    const { error: err } = await authClient.signIn.email({ email: email.trim(), password });
    setBusy(false);
    // On success the session updates and the app switches to Home on its own.
    if (err) {
      if (err.code === "INVALID_EMAIL_OR_PASSWORD") {
        try {
          const res = await fetch(`${API_URL}/api/v1/auth/methods?email=${encodeURIComponent(email.trim().toLowerCase())}`);
          if (res.ok) {
            const data = await res.json();
            if (data.hasGoogle && !data.hasPassword) {
              return setError("This account was created with Google. Please tap 'Continue with Google' to log in.");
            }
          }
        } catch {}
      }
      setError(authErrorMessage(err));
    }
  }

  return (
    <AuthScreen
      title="Log in"
      footer={
        <Text style={{ color: colors.muted }}>
          New to Nesora?{" "}
          <Link href="/signup" style={[styles.link, { color: colors.accent }]}>
            Create an account
          </Link>
        </Text>
      }
    >
      <GoogleButton />
      <Divider />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <TextField
        ref={passwordRef}
        label="Password"
        password
        value={password}
        onChangeText={setPassword}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      <Button title="Log in" variant="primary" size="lg" fullWidth loading={busy} onPress={submit} />
      <Link href="/forgot-password" style={[styles.link, styles.center, { color: colors.accent }]}>
        Forgot password?
      </Link>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  link: { fontWeight: "600" },
  center: { textAlign: "center" },
});
