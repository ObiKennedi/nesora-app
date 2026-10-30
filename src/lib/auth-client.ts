// File: nesora-app/src/lib/auth-client.ts
import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import { oneTimeTokenClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";
import { API_URL, APP_SCHEME } from "./config";

// Same accounts as the website (Better Auth). The session is kept in the
// phone's secure storage and sent to the API as a Cookie header.
export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({ scheme: APP_SCHEME, storagePrefix: "nesora", storage: SecureStore }),
    oneTimeTokenClient(),
  ],
});

/** Turns Better Auth error codes into plain messages (mirrors the website). */
export function authErrorMessage(error: { code?: string; message?: string; status?: number } | null | undefined) {
  switch (error?.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "That email and password don't match an account. Check them and try again.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "An account with this email already exists. Log in instead.";
    case "INVALID_EMAIL":
      return "Enter a valid email address.";
    case "PASSWORD_TOO_SHORT":
      return "Password must be at least 8 characters.";
    case "ACCOUNT_SUSPENDED":
      return "This account has been suspended. Contact support@nesora.org if you think this is a mistake.";
    case "INVALID_ORIGIN":
      return "Security validation failed (untrusted origin). Please reload the app and try again.";
  }
  if (error?.status === 429) return "Too many attempts. Wait a minute and try again.";
  return error?.message || "Something went wrong. Check your connection and try again.";
}
