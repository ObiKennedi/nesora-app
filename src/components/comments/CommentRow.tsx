// File: nesora-app/src/components/comments/CommentRow.tsx
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { EllipsisVertical, Trash2 } from "lucide-react-native";
import Avatar from "@/components/ui/Avatar";
import { useContentMenu } from "@/hooks/use-content-menu";
import { timeAgo } from "@/lib/format";
import type { CommentItem } from "@/lib/types";
import { useTheme } from "@/theme/ThemeProvider";

type Props = { comment: CommentItem; onDelete: (id: string) => void; onBlocked: (authorId: string) => void };

export default function CommentRow({ comment, onDelete, onBlocked }: Props) {
  const { colors } = useTheme();
  const menu = useContentMenu({
    report: { target: "COMMENT", id: comment.id },
    block: comment.isOwn ? undefined : { kind: "user", id: comment.author.id, name: comment.author.name },
    onBlocked: () => onBlocked(comment.author.id),
  });

  return (
    <View style={styles.row}>
      <Avatar name={comment.author.name} uri={comment.author.image} size={32} />
      <View style={styles.body}>
        <Text style={[styles.meta, { color: colors.muted }]}>
          <Text style={{ color: colors.text, fontWeight: "600" }}>{comment.author.name}</Text>  {timeAgo(comment.createdAt)}
        </Text>
        <Text style={[styles.text, { color: colors.text }]}>{comment.body}</Text>
      </View>
      {comment.isOwn ? (
        <Pressable
          hitSlop={10}
          accessibilityLabel="Delete comment"
          onPress={() =>
            Alert.alert("Delete comment?", undefined, [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => onDelete(comment.id) },
            ])
          }
        >
          <Trash2 size={18} color={colors.muted} />
        </Pressable>
      ) : (
        <Pressable hitSlop={10} onPress={menu.open} accessibilityLabel="More actions">
          <EllipsisVertical size={18} color={colors.muted} />
        </Pressable>
      )}
      {menu.sheets}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 10 },
  body: { flex: 1, gap: 2 },
  meta: { fontSize: 12 },
  text: { fontSize: 14, lineHeight: 20 },
});