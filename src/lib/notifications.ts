import { Platform } from "react-native";
import { api } from "./api";

/**
 * Registers this device's push token with the NESORA backend.
 * Call after successful sign-in and on app launch.
 */
export async function registerPushDeviceToken(token: string) {
  if (!token) return { ok: false };
  const platform = Platform.OS === "ios" ? "ios" : "android";
  return api<{ ok: boolean }>("/devices", {
    method: "POST",
    body: { token, platform },
  });
}

/**
 * Unregisters the device push token before sign-out.
 */
export async function unregisterPushDeviceToken(token: string) {
  if (!token) return { ok: false };
  return api<{ ok: boolean }>("/devices", {
    method: "DELETE",
    body: { token },
  });
}
