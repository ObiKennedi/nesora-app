// File: nesora-app/src/components/ui/Button.tsx
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { radius } from "@/theme/colors";

type Variant = "primary" | "secondary" | "ghost" | "accent" | "danger";

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: "md" | "sm" | "lg";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
};

/** Pill button, matching the website's .pill-button. */
export default function Button({ title, onPress, variant = "secondary", size = "md", loading, disabled, icon, style, fullWidth }: Props) {
  const { colors } = useTheme();
  const bg = {
    primary: colors.inverseBg,
    secondary: colors.chip,
    ghost: "transparent",
    accent: colors.accentStrong,
    danger: "transparent",
  }[variant];
  const fg = {
    primary: colors.inverseText,
    secondary: colors.text,
    ghost: colors.text,
    accent: "#ffffff",
    danger: colors.danger,
  }[variant];
  const height = size === "sm" ? 32 : size === "lg" ? 48 : 40;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          height,
          paddingHorizontal: size === "sm" ? 12 : 20,
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
          borderWidth: variant === "danger" ? StyleSheet.hairlineWidth : 0,
          borderColor: colors.border,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text style={[styles.label, { color: fg, fontSize: size === "sm" ? 13 : 15 }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { fontWeight: "600" },
});