// File: nesora-app/src/components/comments/CommentsSheet.tsx
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SendHorizontal } from "lucide-react-native";
import CommentRow from "@/components/comments/CommentRow";
import BottomSheet from "@/components/sheets/BottomSheet";
import { useComments } from "@/hooks/use-comments";
import { formatCount } from "@/lib/format";
import { useTheme } from "@/theme/ThemeProvider";
import { radius } from "@/theme/colors";

type Props = { videoId: string; visible: boolean; onClose: () => void; onCountChange: (count: number) => void };

export default function CommentsSheet({ videoId, visible, onClose, onCountChange }: Props) {
  const { colors } = useTheme();
  const comments = useComments(videoId, visible, onCountChange);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  async function send() {
    const body = text.trim();
    if (!body || posting) return;
    setPosting(true);
    if (await comments.post(body)) setText("");
    setPosting(false);
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title={`Comments ${comments.total ? formatCount(comments.total) : ""}`} height={0.7}>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={comments.items}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <CommentRow comment={item} onDelete={comments.remove} onBlocked={comments.hideAuthor} />}
        onEndReached={comments.loadMore}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          comments.loaded ? <Text style={[styles.empty, { color: colors.muted }]}>No comments yet. Start the conversation.</Text> : undefined
        }
        ListFooterComponent={comments.loading ? <ActivityIndicator style={styles.spinner} color={colors.muted} /> : undefined}
      />
      {comments.error ? <Text style={[styles.error, { color: colors.danger }]}>{comments.error}</Text> : null}
      <View style={[styles.compose, { borderTopColor: colors.border }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Add a comment…"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={1000}
          style={[styles.input, { color: colors.text, backgroundColor: colors.chip }]}
        />
        <Pressable onPress={send} disabled={posting || !text.trim()} accessibilityLabel="Post comment" style={{ opacity: posting || !text.trim() ? 0.4 : 1 }}>
          <SendHorizontal size={24} color={colors.accent} />
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16 },
  empty: { textAlign: "center", paddingVertical: 32 },
  spinner: { marginVertical: 16 },
  error: { paddingHorizontal: 16, paddingVertical: 4 },
  compose: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, minHeight: 40, maxHeight: 110, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
});