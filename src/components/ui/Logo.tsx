// File: nesora-app/src/components/ui/Logo.tsx
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@/theme/ThemeProvider";

export type LogoProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  suffix?: string;
};

export default function Logo({ size = 22, style, textStyle, suffix }: LogoProps) {
  const { colors } = useTheme();
  // Icon height matches the cap-height of the typography
  const iconSize = Math.round(size * 1.05);

  return (
    <View style={[styles.container, style]} accessibilityRole="header" accessibilityLabel="Nesora">
      <Image
        source={require("../../../assets/images/icons.png")}
        style={{ width: iconSize, height: iconSize }}
        contentFit="contain"
      />
      <Text
        style={[
          styles.text,
          {
            fontSize: size,
            letterSpacing: -0.04 * size,
            color: colors.accent,
            lineHeight: Math.round(size * 1.15),
          },
          textStyle,
        ]}
      >
        esora
      </Text>
      {suffix ? (
        <View style={[styles.suffixBadge, { backgroundColor: colors.chip, borderColor: colors.border }]}>
          <Text style={[styles.suffixText, { color: colors.text, fontSize: Math.max(10, Math.round(size * 0.45)) }]}>
            {suffix}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1.5,
  },
  text: {
    fontWeight: "800",
  },
  suffixBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  suffixText: {
    fontWeight: "700",
    textTransform: "uppercase",
  },
});