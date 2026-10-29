// File: nesora-app/src/app/(auth)/signup.tsx
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

export default function SignupScreen() {
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);

  async function submit() {
    if (name.trim().length < 2) return setError("Enter your name.");
    if (!email.trim()) return setError("Enter your email.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setBusy(true);
    setError(null);
    // Signing up logs the user in and goes straight to Home (no onboarding).
    const normalizedEmail = email.trim().toLowerCase();
    const { error: err } = await authClient.signUp.email({ name: name.trim(), email: normalizedEmail, password });
    setBusy(false);
    if (err) {
      if (err.code === "USER_ALREADY_EXISTS" || err.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
        try {
          const res = await fetch(`${API_URL}/api/v1/auth/methods?email=${encodeURIComponent(normalizedEmail)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.hasGoogle && !data.hasPassword) {
              return setError("An account with this email was created with Google. Tap 'Continue with Google' to log in.");
            }
          }
        } catch {}
      }
      setError(authErrorMessage(err));
    }
  }

  return (
    <AuthScreen
      title="Create your account"
      subtitle="Watch long videos and Shorts from the creators you love."
      footer={
        <Text style={{ color: colors.muted }}>
          Already have an account?{" "}
          <Link href="/login" style={[styles.link, { color: colors.accent }]}>
            Log in
          </Link>
        </Text>
      }
    >
      <GoogleButton />
      <Divider />
      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <TextField
        ref={emailRef}
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
        hint="At least 8 characters."
        value={password}
        onChangeText={setPassword}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      <Button title="Create account" variant="primary" size="lg" fullWidth loading={busy} onPress={submit} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({ link: { fontWeight: "600" } });
