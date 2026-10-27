// File: nesora-app/src/app/_layout.tsx
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { focusManager, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/lib/query-client";
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";

SplashScreen.preventAutoHideAsync();

// Refresh data (balance, feeds) when the app comes back to the foreground —
// e.g. after buying storage on the website.
focusManager.setEventListener((setFocused) => {
  const sub = AppState.addEventListener("change", (state) => {
    if (Platform.OS !== "web") setFocused(state === "active");
  });
  return () => sub.remove();
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { scheme, colors } = useTheme();
  const { data: session, isPending } = authClient.useSession();
  const signedIn = Boolean(session);

  useEffect(() => {
    if (!isPending) SplashScreen.hideAsync().catch(() => {});
  }, [isPending]);

  // A different account (or none) must never see the last user's cached data.
  useEffect(() => {
    if (!signedIn) queryClient.clear();
  }, [signedIn, session?.user.id]);

  if (isPending) return null; // splash screen stays up

  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: "fade_from_bottom" }}>
        {/* Every user is a fan; logging in or signing up goes straight to Home. */}
        <Stack.Protected guard={signedIn} redirectTo="/login">
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="watch/[id]" options={{ headerShown: false, animation: "slide_from_bottom" }} />
          {(["channel/[handle]", "search", "notifications", "storage", "blocked"] as const).map((name) => (
            <Stack.Screen
              key={name}
              name={name}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: colors.text,
                headerShadowVisible: false,
                headerBackButtonDisplayMode: "minimal",
                title: { search: "", notifications: "Notifications", storage: "Storage", blocked: "Blocked" }[name as string] ?? "",
              }}
            />
          ))}
        </Stack.Protected>
        <Stack.Protected guard={!signedIn} redirectTo="/">
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}