// File: nesora-app/src/app/storage.tsx
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { HardDrive } from "lucide-react-native";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { openOnWeb } from "@/lib/handoff";
import type { StorageResponse } from "@/lib/types";
import { useTheme } from "@/theme/ThemeProvider";
import { radius } from "@/theme/colors";

const date = (d: string) => new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

/** Balance and history. Buying happens on the website (no app-store billing). */
export default function StorageScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const query = useQuery({ queryKey: ["storage"], queryFn: () => api<StorageResponse>("/storage") });
  const data = query.data;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={styles.page}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.muted} />}
    >
      <View style={[styles.card, { backgroundColor: colors.warmBg, borderColor: colors.warmBorder }]}>
        <Text style={[styles.label, { color: colors.muted }]}>Your balance</Text>
        <Text style={[styles.balance, { color: colors.text }]}>{data?.label ?? "—"}</Text>
        <Text style={[styles.note, { color: colors.muted }]}>
          Storage pays for long videos as you watch. Every video&apos;s first minute is free, and Shorts are always free.
        </Text>
        <Button title="Buy storage on nesora.org" variant="accent" icon={<HardDrive size={16} color="#fff" />} onPress={() => openOnWeb("/storage")} style={styles.buy} />
      </View>

      {query.isPending ? <ActivityIndicator color={colors.muted} style={{ marginTop: 32 }} /> : null}

      {data ? (
        <>
          <Text style={[styles.heading, { color: colors.text }]}>Storage used</Text>
          {data.spending.length === 0 ? (
            <Text style={[styles.empty, { color: colors.muted }]}>Nothing yet. Storage is only used when you keep watching after a free preview.</Text>
          ) : (
            data.spending.map((s) => (
              <Pressable
                key={s.id}
                disabled={!s.video?.available}
                onPress={() => s.video && router.push({ pathname: "/watch/[id]", params: { id: s.video.id } })}
                style={[styles.row, { borderBottomColor: colors.border }]}
              >
                <View style={styles.rowMain}>
                  <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
                    {s.video?.title ?? "Video"}
                  </Text>
                  <Text style={[styles.rowMeta, { color: colors.muted }]} numberOfLines={1}>
                    {s.video ? `${s.video.channel} · ` : ""}
                    {s.minutes ? `${s.minutes} min watched · ` : ""}
                    {date(s.date)}
                  </Text>
                </View>
                <Text style={[styles.amount, { color: colors.text }]}>−{s.storage}</Text>
              </Pressable>
            ))
          )}

          <Text style={[styles.heading, { color: colors.text }]}>Purchases</Text>
          {data.purchases.length === 0 ? (
            <Text style={[styles.empty, { color: colors.muted }]}>No purchases yet.</Text>
          ) : (
            data.purchases.map((p) => (
              <View key={p.id} style={[styles.row, { borderBottomColor: colors.border }]}>
                <View style={styles.rowMain}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>{p.storage}</Text>
                  <Text style={[styles.rowMeta, { color: colors.muted }]}>{date(p.date)}</Text>
                </View>
                <View style={styles.end}>
                  <Text style={[styles.amount, { color: colors.text }]}>₦{p.naira.toLocaleString("en-NG")}</Text>
                  <Text style={{ color: p.status === "SUCCESS" ? colors.success : colors.danger, fontSize: 12, fontWeight: "600" }}>
                    {p.status === "SUCCESS" ? "Paid" : "Failed"}
                  </Text>
                </View>
              </View>
            ))
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 40 },
  card: { padding: 16, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, gap: 6 },
  label: { fontSize: 13 },
  balance: { fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
  note: { fontSize: 13, lineHeight: 18 },
  buy: { marginTop: 8 },
  heading: { fontSize: 17, fontWeight: "700", marginTop: 24, marginBottom: 4 },
  empty: { fontSize: 14, lineHeight: 20, paddingVertical: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  rowMain: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: "600" },
  rowMeta: { fontSize: 12 },
  amount: { fontSize: 14, fontWeight: "700" },
  end: { alignItems: "flex-end", gap: 2 },
});