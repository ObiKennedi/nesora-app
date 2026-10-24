// File: nesora-app/src/components/AppHeader.tsx
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Bell, HardDrive, Plus, Search } from "lucide-react-native";
import Logo from "@/components/ui/Logo";
import { useMe } from "@/hooks/use-me";
import { openOnWeb } from "@/lib/handoff";
import { useTheme } from "@/theme/ThemeProvider";
import { radius } from "@/theme/colors";

/**
 * Top bar like the website: logo · + Create · storage · search · notifications.
 * Create opens the Creator Studio on the website; the balance opens Buy storage.
 */
export default function AppHeader() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: me } = useMe();
  const unread = me?.unreadNotifications ?? 0;

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 6, backgroundColor: colors.bg }]}>
      <Logo />
      <View style={styles.end}>
        <Pressable
          onPress={() => openOnWeb(me?.user.channel ? "/studio" : "/studio/new")}
          accessibilityRole="button"
          accessibilityLabel="Create — opens Nesora Studio on the website"
          style={({ pressed }) => [styles.pill, { backgroundColor: colors.chip, opacity: pressed ? 0.7 : 1 }]}
        >
          <Plus size={18} color={colors.text} />
          <Text style={[styles.pillText, { color: colors.text }]}>Create</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/storage")}
          accessibilityRole="button"
          accessibilityLabel={`Storage balance ${me?.storage.label ?? ""}`}
          style={({ pressed }) => [styles.pill, { backgroundColor: colors.chip, opacity: pressed ? 0.7 : 1 }]}
        >
          <HardDrive size={15} color={colors.accent} />
          <Text style={[styles.pillText, { color: colors.text }]}>{me?.storage.label ?? "—"}</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/search")} style={styles.icon} accessibilityRole="button" accessibilityLabel="Search" hitSlop={4}>
          <Search size={22} color={colors.text} />
        </Pressable>
        <Pressable
          onPress={() => router.push("/notifications")}
          style={styles.icon}
          accessibilityRole="button"
          accessibilityLabel={unread ? `Notifications, ${unread} unread` : "Notifications"}
          hitSlop={4}
        >
          <Bell size={22} color={colors.text} />
          {unread > 0 ? (
            <View style={[styles.badge, { borderColor: colors.bg }]}>
              <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: 14, paddingRight: 6, paddingBottom: 8 },
  end: { flexDirection: "row", alignItems: "center", gap: 4 },
  pill: { flexDirection: "row", alignItems: "center", gap: 5, height: 32, paddingHorizontal: 10, borderRadius: radius.pill, marginRight: 2 },
  pillText: { fontSize: 13, fontWeight: "600" },
  icon: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: 2, right: 0, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: "#cc0000", borderWidth: 2, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
});