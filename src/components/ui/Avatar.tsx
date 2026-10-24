// File: nesora-app/src/components/ui/Avatar.tsx
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { initials } from "@/lib/format";

type Props = { name: string | null | undefined; uri?: string | null; size?: number };

export default function Avatar({ name, uri, size = 36 }: Props) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" transition={150} />;
  }
  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.text, { fontSize: Math.round(size * 0.4) }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: "#7a3a17", alignItems: "center", justifyContent: "center" },
  text: { color: "#fff", fontWeight: "600" },
});