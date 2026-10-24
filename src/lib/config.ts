// File: nesora-app/src/lib/config.ts
// Where the app finds the Nesora server. Set EXPO_PUBLIC_API_URL in .env to
// point at a local or staging server; production is nesora.org.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "https://nesora.org").replace(/\/$/, "");

/** Deep-link scheme — must match "scheme" in app.json and trustedOrigins on the server. */
export const APP_SCHEME = "nesora";