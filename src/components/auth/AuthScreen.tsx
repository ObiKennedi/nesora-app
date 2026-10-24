// File: nesora-app/src/components/auth/AuthScreen.tsx
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Logo from "@/components/ui/Logo";
import { useTheme } from "@/theme/ThemeProvider";

type Props = { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode };

/** Shared layout for Log in / Sign up / Forgot password. */
export default function AuthScreen({ title, subtitle, children, footer }: Props) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.hero, { backgroundColor: colors.warmBg, borderColor: colors.warmBorder }]}>
            <Logo size={34} />
            <Text style={[styles.tagline, { color: colors.muted }]}>Watch the creators you love.</Text>
          </View>
          <View style={styles.card}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            {subtitle ? <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text> : null}
            <View style={styles.body}>{children}</View>
          </View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: 20, gap: 24, justifyContent: "center" },
  hero: { alignItems: "center", gap: 6, paddingVertical: 28, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth },
  tagline: { fontSize: 15 },
  card: { gap: 6 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 15, lineHeight: 21 },
  body: { gap: 16, marginTop: 14 },
  footer: { alignItems: "center", gap: 12 },
});