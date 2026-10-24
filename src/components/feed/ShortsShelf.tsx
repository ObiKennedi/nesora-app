// File: nesora-app/src/components/feed/ShortsShelf.tsx
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Zap } from "lucide-react-native";
import { formatViews } from "@/lib/format";
import type { ShortCard } from "@/lib/types";
import { useTheme } from "@/theme/ThemeProvider";

export default function ShortsShelf({ shorts, title = "Shorts" }: { shorts: ShortCard[]; title?: string }) {
  const { colors } = useTheme();
  const router = useRouter();
  if (shorts.length === 0) return null;

  return (
    <View style={styles.shelf}>
      <View style={styles.head}>
        <Zap size={22} color={colors.accent} fill={colors.accent} />
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>
      <FlatList
        horizontal
        data={shorts}
        keyExtractor={(s) => s.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push({ pathname: "/shorts", params: { start: item.id } })}
            accessibilityRole="button"
            accessibilityLabel={item.title}
          >
            <View style={[styles.thumb, { backgroundColor: colors.raised }]}>
              {item.thumbnailUrl ? <Image source={{ uri: item.thumbnailUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} /> : null}
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={[styles.meta, { color: colors.muted }]}>{formatViews(item.viewCount)}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shelf: { marginBottom: 24 },
  head: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, marginBottom: 10 },
  title: { fontSize: 18, fontWeight: "700" },
  row: { gap: 10, paddingHorizontal: 12 },
  card: { width: 150, gap: 4 },
  thumb: { width: 150, aspectRatio: 9 / 16, borderRadius: 12, overflow: "hidden" },
  cardTitle: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  meta: { fontSize: 12 },
});