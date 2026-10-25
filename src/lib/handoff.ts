// File: nesora-app/src/lib/handoff.ts
import * as WebBrowser from "expo-web-browser";
import { authClient } from "./auth-client";
import { API_URL } from "./config";

// Some things only happen on the website: buying storage and the Creator
// Studio. We open them in the browser already signed in, using a one-minute,
// single-use token (the server's /handoff route redeems it).

export type WebPage = "/storage" | "/studio" | "/studio/new" | `/watch/${string}` | "/terms" | "/copyright" | "/privacy";

export async function openOnWeb(next: WebPage) {
  let url = `${API_URL}${next}`;
  try {
    const { data } = await authClient.oneTimeToken.generate();
    if (data?.token) url = `${API_URL}/handoff?token=${encodeURIComponent(data.token)}&next=${encodeURIComponent(next)}`;
  } catch {
    // Fall back to the plain page; they can log in there.
  }
  await WebBrowser.openBrowserAsync(url, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN });
}