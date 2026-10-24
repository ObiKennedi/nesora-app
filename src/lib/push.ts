// File: nesora-app/src/lib/push.ts
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { api } from "@/lib/api";

// Push notifications: "<channel> uploaded a new video". The server sends them
// through Expo's push service when a subscribed channel publishes.
//
// Needs a development or store build and an EAS project id (run `eas init`).
// Expo Go on Android can't receive push, so this quietly does nothing there.

const TOKEN_KEY = "nesora_push_token";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPush() {
  try {
    if (!Device.isDevice) return null;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "New uploads",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    const status = existing.granted ? existing.status : (await Notifications.requestPermissionsAsync()).status;
    if (status !== "granted") return null;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api("/devices", { method: "POST", body: { token, platform: Platform.OS === "ios" ? "ios" : "android" } });
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    return token;
  } catch (error) {
    console.warn("[push] registration skipped", error);
    return null;
  }
}

/** Call before signing out so the phone stops getting this user's alerts. */
export async function unregisterPush() {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) return;
    await api("/devices", { method: "DELETE", body: { token } });
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Signing out still works; the server drops dead tokens on its own.
  }
}