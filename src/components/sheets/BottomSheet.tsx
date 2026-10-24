// File: nesora-app/src/components/sheets/BottomSheet.tsx
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Fraction of the screen height (0–1). Omit to fit the content. */
  height?: number;
};

/** Slide-up sheet used for comments, reports and menus. */
export default function BottomSheet({ visible, onClose, title, children, height }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={[styles.backdrop, { backgroundColor: colors.scrim }]} onPress={onClose} accessibilityLabel="Close" />
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.bg, paddingBottom: Math.max(insets.bottom, 12) },
            height ? { height: `${Math.round(height * 100)}%` } : null,
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          {title ? (
            <View style={styles.head}>
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
                <X size={22} color={colors.text} />
              </Pressable>
            </View>
          ) : null}
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  sheet: { borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingTop: 8 },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginBottom: 6 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 8 },
  title: { fontSize: 17, fontWeight: "700" },
});