// File: nesora-app/src/components/ui/TextField.tsx
import { forwardRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputInstance, type TextInputProps } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { radius } from "@/theme/colors";

type Props = TextInputProps & { label: string; error?: string | null; hint?: string; password?: boolean };

const TextField = forwardRef<TextInputInstance, Props>(function TextField({ label, error, hint, password, style, ...props }, ref) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View
        style={[
          styles.box,
          {
            backgroundColor: colors.inputBg,
            borderColor: error ? colors.danger : focused ? colors.accent : colors.border,
          },
        ]}
      >
        <TextInput
          ref={ref}
          placeholderTextColor={colors.muted}
          secureTextEntry={password && hidden}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          style={[styles.input, { color: colors.text }, style]}
          {...props}
        />
        {password && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={12}
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
            style={styles.eye}
          >
            {hidden ? <Eye size={20} color={colors.muted} /> : <EyeOff size={20} color={colors.muted} />}
          </Pressable>
        )}
      </View>
      {error ? (
        <Text style={[styles.note, { color: colors.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.note, { color: colors.muted }]}>{hint}</Text>
      ) : null}
    </View>
  );
});

export default TextField;

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600" },
  box: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: radius.md, minHeight: 48 },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  eye: { paddingHorizontal: 14 },
  note: { fontSize: 13 },
});