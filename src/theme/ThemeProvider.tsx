// File: nesora-app/src/theme/ThemeProvider.tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from "expo-router";
import { palette, type Colors } from "../theme/colors";

// Light / Dark / System, like the website's switch. The choice is saved on the device.

export type ThemePreference = "system" | "light" | "dark";

type ThemeValue = {
  colors: Colors;
  scheme: "light" | "dark";
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
};

const STORAGE_KEY = "nesora_theme";
const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((saved) => {
        if (saved === "light" || saved === "dark" || saved === "system") setPreferenceState(saved);
      })
      .catch(() => {});
  }, []);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    SecureStore.setItemAsync(STORAGE_KEY, p).catch(() => {});
  }, []);

  // The website defaults to dark; follow the phone when set to System.
  const scheme: "light" | "dark" = preference === "system" ? (system === "light" ? "light" : "dark") : preference;
  const colors = palette[scheme];

  const value = useMemo(() => ({ colors, scheme, preference, setPreference }), [colors, scheme, preference, setPreference]);

  const navigationTheme = useMemo(() => {
    const base = scheme === "dark" ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, primary: colors.accent, background: colors.bg, card: colors.bg, text: colors.text, border: colors.border },
    };
  }, [scheme, colors]);

  return (
    <ThemeContext.Provider value={value}>
      <NavigationThemeProvider value={navigationTheme}>{children}</NavigationThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}