// File: nesora-app/src/app/(tabs)/_layout.tsx
import { Pressable, StyleSheet, View } from "react-native";
import { Tabs } from "expo-router/tabs";
import { House, Plus, SquarePlay, Zap } from "lucide-react-native";
import Avatar from "@/components/ui/Avatar";
import { useMe } from "@/hooks/use-me";
import { usePush } from "@/hooks/use-push";
import { openOnWeb } from "@/lib/handoff";
import { useTheme } from "@/theme/ThemeProvider";

// Home · Shorts · + (buy storage on the website) · Subscriptions · You — same as the website.
export default function TabsLayout() {
  const { colors, scheme } = useTheme();
  const { data: me } = useMe();
  usePush(); // upload alerts for subscribed channels

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.text,
        tabBarLabelStyle: { fontSize: 10 },
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color }) => <House size={24} color={color} strokeWidth={focused ? 2.4 : 1.8} />,
        }}
      />
      <Tabs.Screen
        name="shorts"
        options={{
          title: "Shorts",
          tabBarIcon: ({ focused, color }) => <Zap size={24} color={color} strokeWidth={focused ? 2.4 : 1.8} />,
          // Shorts is full-screen black, like the website.
          tabBarStyle: { backgroundColor: scheme === "dark" ? colors.bg : "#0f0f0f", borderTopColor: "#272727" },
          tabBarActiveTintColor: "#ffffff",
          tabBarInactiveTintColor: "#ffffff",
        }}
      />
      <Tabs.Screen
        name="buy"
        options={{
          title: "Buy storage",
          tabBarLabel: () => null,
          // Not a screen: storage is bought on the website (no app-store billing).
          tabBarButton: () => (
            <View style={styles.plusWrap}>
              <Pressable
                onPress={() => openOnWeb("/storage")}
                accessibilityRole="button"
                accessibilityLabel="Buy storage on nesora.org"
                style={({ pressed }) => [styles.plus, { backgroundColor: colors.chip, opacity: pressed ? 0.7 : 1 }]}
              >
                <Plus size={26} color={colors.text} />
              </Pressable>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="subscriptions"
        options={{
          title: "Subscriptions",
          tabBarIcon: ({ focused, color }) => <SquarePlay size={24} color={color} strokeWidth={focused ? 2.4 : 1.8} />,
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: "You",
          tabBarIcon: ({ focused }) => (
            <View style={[styles.avatarRing, { borderColor: focused ? colors.text : "transparent" }]}>
              <Avatar name={me?.user.name} uri={me?.user.image} size={24} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  plusWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  plus: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarRing: { borderWidth: 1.5, borderRadius: 14, padding: 1 },
});