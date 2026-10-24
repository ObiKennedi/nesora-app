// File: nesora-app/src/components/ui/Logo.tsx
import { Text, type TextStyle } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

export default function Logo({ size = 22, style }: { size?: number; style?: TextStyle }) {
  const { colors } = useTheme();
  return (
    <Text style={[{ fontSize: size, fontWeight: "800", letterSpacing: -0.04 * size, color: colors.accent }, style]} accessibilityRole="header">
      Nesora
    </Text>
  );
}