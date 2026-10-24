// File: nesora-app/src/hooks/use-content-menu.tsx
import { useState } from "react";
import { Alert } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { Ban, Flag } from "lucide-react-native";
import ActionSheet, { type SheetAction } from "@/components/sheets/ActionSheet";
import ReportSheet, { type ReportTarget } from "@/components/sheets/ReportSheet";
import { api, ApiError } from "@/lib/api";

type Options = {
  report: { target: ReportTarget; id: string };
  /** Omit for your own content. */
  block?: { kind: "channel" | "user"; id: string; name: string };
  onBlocked?: () => void;
};

/**sss
 * "⋮" menu with Report and Block — the same choices as the website.
 * Returns `open()` and the sheets to render.
 */
export function useContentMenu({ report, block, onBlocked }: Options) {
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  function confirmBlock() {
    if (!block) return;
    Alert.alert(
      `Block ${block.name}?`,
      "You won't see their videos, Shorts or comments, and they won't be able to comment on your videos. You can unblock them from the You tab.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              await api("/blocks", { method: "POST", body: block.kind === "channel" ? { channelId: block.id } : { userId: block.id } });
              onBlocked?.();
              // Their content disappears from every feed.
              queryClient.invalidateQueries();
            } catch (e) {
              Alert.alert("Couldn't block", e instanceof ApiError ? e.message : "Try again.");
            }
          },
        },
      ],
    );
  }

  const actions: SheetAction[] = [{ label: "Report", icon: Flag, onPress: () => setReportOpen(true) }];
  if (block) actions.push({ label: `Block ${block.name}`, icon: Ban, onPress: confirmBlock, danger: true });

  const sheets = (
    <>
      <ActionSheet visible={menuOpen} onClose={() => setMenuOpen(false)} actions={actions} />
      <ReportSheet visible={reportOpen} onClose={() => setReportOpen(false)} target={report.target} id={report.id} />
    </>
  );

  return { open: () => setMenuOpen(true), sheets };
}