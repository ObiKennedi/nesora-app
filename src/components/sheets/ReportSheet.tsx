// File: nesora-app/src/components/sheets/ReportSheet.tsx
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import BottomSheet from "@/components/sheets/BottomSheet";
import Button from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { useTheme } from "@/theme/ThemeProvider";
import { radius } from "@/theme/colors";

export type ReportTarget = "VIDEO" | "COMMENT" | "CHANNEL";

const REASONS = [
  { value: "SEXUAL", label: "Sexual content or nudity" },
  { value: "VIOLENT", label: "Violent or graphic content" },
  { value: "HATEFUL", label: "Hateful or abusive content" },
  { value: "HARASSMENT", label: "Harassment or bullying" },
  { value: "HARMFUL", label: "Dangerous acts or self-harm" },
  { value: "CHILD_SAFETY", label: "Puts a child at risk" },
  { value: "SPAM", label: "Spam or misleading" },
  { value: "COPYRIGHT", label: "Uses my content without permission" },
  { value: "OTHER", label: "Something else" },
] as const;

const TITLES: Record<ReportTarget, string> = { VIDEO: "Report video", COMMENT: "Report comment", CHANNEL: "Report channel" };

type Props = { visible: boolean; onClose: () => void; target: ReportTarget; id: string };

export default function ReportSheet({ visible, onClose, target, id }: Props) {
  const { colors } = useTheme();
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setReason(null);
    setDetails("");
    setError(null);
    setDone(false);
  }, [visible]);

  async function submit() {
    if (!reason) return setError("Choose a reason.");
    setBusy(true);
    setError(null);
    try {
      await api("/reports", { method: "POST", body: { target, id, reason, details: details.trim() || undefined } });
      setDone(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't send the report. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title={done ? "Thanks for reporting" : TITLES[target]} height={done ? undefined : 0.85}>
      {done ? (
        <View style={styles.body}>
          <Text style={{ color: colors.muted, lineHeight: 21 }}>
            Our team will review it. If it breaks Nesora&apos;s rules, we&apos;ll remove it. You can also block the person so you
            don&apos;t see their content.
          </Text>
          <Button title="Done" variant="primary" onPress={onClose} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {REASONS.map((r) => {
            const on = reason === r.value;
            return (
              <Pressable key={r.value} onPress={() => setReason(r.value)} style={styles.option} accessibilityRole="radio" accessibilityState={{ selected: on }}>
                <View style={[styles.radio, { borderColor: on ? colors.accent : colors.muted }]}>
                  {on ? <View style={[styles.dot, { backgroundColor: colors.accent }]} /> : null}
                </View>
                <Text style={{ color: colors.text, fontSize: 15 }}>{r.label}</Text>
              </Pressable>
            );
          })}
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 8 }}>Details {reason === "OTHER" ? "" : "(optional)"}</Text>
          <TextInput
            value={details}
            onChangeText={setDetails}
            multiline
            maxLength={1000}
            placeholder="Anything that helps us understand the problem"
            placeholderTextColor={colors.muted}
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
          />
          {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
          <Button title="Report" variant="primary" fullWidth loading={busy} disabled={!reason} onPress={submit} />
        </ScrollView>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingBottom: 12, gap: 6 },
  option: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 10 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  dot: { width: 10, height: 10, borderRadius: 5 },
  input: { minHeight: 80, borderWidth: 1, borderRadius: radius.md, padding: 12, textAlignVertical: "top", marginBottom: 8 },
});