// File: nesora-app/src/app/(tabs)/you.tsx
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ban, Bell, ChevronRight, Clapperboard, FileText, HardDrive, History, LifeBuoy, LogOut, Scale, Shield } from "lucide-react-native";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { useMe } from "@/hooks/use-me";
import { api, ApiError } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { openOnWeb } from "@/lib/handoff";
import { signOut as doSignOut } from "@/lib/sign-out";
import { useTheme, type ThemePreference } from "@/theme/ThemeProvider";
import { radius } from "@/theme/colors";

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export default function YouScreen() {
  const { colors, preference, setPreference } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: me, refetch, isRefetching } = useMe();
  const router = useRouter();
  const unread = me?.unreadNotifications ?? 0;

  function signOut() {
    Alert.alert("Sign out?", undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => void doSignOut() },
    ]);
  }

  function deleteAccount() {
    Alert.alert(
      "Delete your account?",
      "This permanently deletes your Nesora account, your comments and any storage left in your balance. It can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: async () => {
            try {
              await api("/me/delete", { method: "POST" });
              await authClient.signOut().catch(() => {});
            } catch (e) {
              Alert.alert("Couldn't delete your account", e instanceof ApiError ? e.message : "Try again.");
            }
          },
        },
      ],
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[styles.page, { paddingTop: insets.top + 16 }]}
    >
      <View style={styles.header}>
        <Avatar name={me?.user.name} uri={me?.user.image} size={64} />
        <View style={styles.headerText}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {me?.user.name ?? " "}
          </Text>
          <Text style={[styles.email, { color: colors.muted }]} numberOfLines={1}>
            {me?.user.email ?? " "}
          </Text>
        </View>
      </View>

      {/* Storage: shown here, bought on the website. */}
      <View style={[styles.card, { backgroundColor: colors.warmBg, borderColor: colors.warmBorder }]}>
        <Text style={[styles.label, { color: colors.muted }]}>Storage balance</Text>
        <Text style={[styles.balance, { color: colors.text }]}>{me?.storage.label ?? "—"}</Text>
        <Text style={[styles.note, { color: colors.muted }]}>
          Long videos use storage after the free preview. Shorts are always free.
        </Text>
        <View style={styles.cardActions}>
          <Button title="Buy storage on nesora.org" variant="accent" icon={<HardDrive size={16} color="#fff" />} onPress={() => openOnWeb("/storage")} />
          <Button title={isRefetching ? "Refreshing…" : "Refresh"} variant="ghost" size="sm" onPress={() => refetch()} />
        </View>
      </View>

      <View style={[styles.list, { borderColor: colors.border }]}>
        <Row icon={<Bell size={22} color={colors.text} />} title="Notifications" badge={unread} onPress={() => router.push("/notifications")} />
        <Row icon={<History size={22} color={colors.text} />} title="Storage history" onPress={() => router.push("/storage")} />
        <Row icon={<Ban size={22} color={colors.text} />} title="Blocked" onPress={() => router.push("/blocked")} />
        <Pressable
          onPress={() => openOnWeb(me?.user.channel ? "/studio" : "/studio/new")}
          style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
          accessibilityRole="button"
        >
          <Clapperboard size={22} color={colors.text} />
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>{me?.user.channel ? "Nesora Studio" : "Become a creator"}</Text>
            <Text style={[styles.rowSub, { color: colors.muted }]}>Upload and manage videos on the website</Text>
          </View>
          <ChevronRight size={20} color={colors.muted} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>More info and support</Text>
        <View style={[styles.list, { borderColor: colors.border }]}>
          <Pressable
            onPress={() => Linking.openURL("mailto:hello@nesora.com")}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
            accessibilityRole="button"
          >
            <LifeBuoy size={22} color={colors.text} />
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Help & Customer Service</Text>
              <Text style={[styles.rowSub, { color: colors.muted }]}>hello@nesora.com · hello@nesora.org</Text>
            </View>
            <ChevronRight size={20} color={colors.muted} />
          </Pressable>
          <Row
            icon={<FileText size={22} color={colors.text} />}
            title="Terms of Service"
            onPress={() => openOnWeb("/terms")}
          />
          <Row
            icon={<Scale size={22} color={colors.text} />}
            title="Copyright & Intellectual Property"
            onPress={() => openOnWeb("/copyright")}
          />
          <Row
            icon={<Shield size={22} color={colors.text} />}
            title="Privacy Policy"
            onPress={() => openOnWeb("/privacy")}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
        <View style={[styles.segmented, { backgroundColor: colors.chip }]}>
          {THEMES.map((t) => {
            const on = preference === t.value;
            return (
              <Pressable
                key={t.value}
                onPress={() => setPreference(t.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                style={[styles.segment, on && { backgroundColor: colors.inverseBg }]}
              >
                <Text style={{ color: on ? colors.inverseText : colors.text, fontWeight: "600" }}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable onPress={signOut} style={({ pressed }) => [styles.row, styles.signOut, { opacity: pressed ? 0.6 : 1 }]} accessibilityRole="button">
        <LogOut size={22} color={colors.danger} />
        <Text style={[styles.rowTitle, { color: colors.danger }]}>Sign out</Text>
      </Pressable>

      <Pressable onPress={deleteAccount} accessibilityRole="button" hitSlop={8}>
        <Text style={[styles.delete, { color: colors.muted }]}>Delete account</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({ icon, title, badge, onPress }: { icon: React.ReactNode; title: string; badge?: number; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]} accessibilityRole="button">
      {icon}
      <Text style={[styles.rowTitle, styles.rowText, { color: colors.text }]}>{title}</Text>
      {badge ? (
        <View style={[styles.count, { backgroundColor: colors.accentStrong }]}>
          <Text style={styles.countText}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      ) : null}
      <ChevronRight size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  count: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: "center", justifyContent: "center" },
  countText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  page: { padding: 16, gap: 20, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", gap: 14 },
  headerText: { flex: 1, gap: 2 },
  name: { fontSize: 22, fontWeight: "700" },
  email: { fontSize: 14 },
  card: { padding: 16, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, gap: 6 },
  label: { fontSize: 13 },
  balance: { fontSize: 30, fontWeight: "800", letterSpacing: -0.5 },
  note: { fontSize: 13, lineHeight: 18 },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" },
  list: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: "600" },
  rowSub: { fontSize: 13 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  segmented: { flexDirection: "row", borderRadius: radius.pill, padding: 4 },
  segment: { flex: 1, height: 36, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  signOut: { marginTop: 4 },
  delete: { fontSize: 13, textDecorationLine: "underline" },
});