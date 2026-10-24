// File: nesora-app/src/theme/colors.ts
// Same palette as the website (component/shell/shell.scss): YouTube-style
// neutrals with Nesora's terracotta accent.

export const palette = {
  dark: {
    bg: "#0f0f0f",
    raised: "#212121",
    chip: "#272727",
    hover: "#3a3a3a",
    border: "#303030",
    text: "#f1f1f1",
    muted: "#aaaaaa",
    accent: "#e8834a",
    accentStrong: "#c2622a",
    inputBg: "#121212",
    inverseBg: "#f1f1f1",
    inverseText: "#0f0f0f",
    warmBg: "#2a1d14",
    warmBorder: "#5a3a20",
    danger: "#ff8a80",
    success: "#7bd88f",
    scrim: "rgba(0,0,0,0.5)",
  },
  light: {
    bg: "#ffffff",
    raised: "#f2f2f2",
    chip: "#f2f2f2",
    hover: "#e5e5e5",
    border: "#e0e0e0",
    text: "#0f0f0f",
    muted: "#606060",
    accent: "#b0561f",
    accentStrong: "#b0561f",
    inputBg: "#ffffff",
    inverseBg: "#0f0f0f",
    inverseText: "#ffffff",
    warmBg: "#fdf1e7",
    warmBorder: "#f0cdb2",
    danger: "#c5221f",
    success: "#1e7a3a",
    scrim: "rgba(0,0,0,0.4)",
  },
} as const;

export type Colors = { [K in keyof typeof palette.dark]: string };

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;