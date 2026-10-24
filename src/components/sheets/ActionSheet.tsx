// File: nesora-app/src/components/sheets/ActionSheet.tsx
import { Pressable, StyleSheet, Text } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import BottomSheet from "@/components/sheets/BottomSheet";
import { useTheme } from "@/theme/ThemeProvider";

export type SheetAction = { label: string; icon: LucideIcon; onPress: () => void; danger?: boolean };

/** A short list of actions (the app's version of the website's "⋮" menu). */
export default function ActionSheet({ visible, onClose, actions }: { visible: boolean; onClose: () => void; actions: SheetAction[] }) {
  const { colors } = useTheme();
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {actions.map(({ label, icon: Icon, onPress, danger }) => (
        <Pressable
          key={label}
          onPress={() => {
            onClose();
            // Let the sheet close before opening the next one.
            setTimeout(onPress, 250);
          }}
          style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.hover : "transparent" }]}
          accessibilityRole="button"
        >
          <Icon size={22} color={danger ? colors.danger : colors.text} />
          <Text style={[styles.label, { color: danger ? colors.danger : colors.text }]}>{label}</Text>
        </Pressable>
      ))}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingVertical: 15 },
  label: { fontSize: 16 },
});