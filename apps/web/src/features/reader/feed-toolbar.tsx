import * as stylex from "@stylexjs/stylex"
import { RefreshCwIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import { formatArticleDate } from "web/features/reader/format-date"

import type { Workspace, useFeeds } from "rpc/reader"
import { useFeedAction } from "rpc/reader"
import { Button } from "ui/button"
import { Modal } from "ui/dialog"
import { tokens } from "ui/styles/tokens.stylex"

const styles = stylex.create({
  toolbar: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    paddingBlock: 12,
    paddingInline: 16,
    marginBottom: 22,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens["--border"],
    borderRadius: 10,
    color: tokens["--muted-foreground"],
    fontSize: 12,
  },
  refreshed: { marginRight: "auto" },
  iconButton: { width: 34, paddingInline: 0 },
  icon: {
    width: { default: 18, "@media (min-width: 640px)": 16 },
    height: { default: 18, "@media (min-width: 640px)": 16 },
    flexShrink: 0,
  },
  error: {
    padding: 12,
    marginBlock: 12,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens["--border"],
    borderRadius: 8,
    backgroundColor: tokens["--muted"],
    fontSize: 13,
    overflowWrap: "anywhere",
  },
  dialogActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 20,
  },
})

export function FeedToolbar({
  workspace,
  feed,
  onRemoved,
}: {
  workspace: Workspace
  feed: NonNullable<ReturnType<typeof useFeeds>["data"]>[number]
  onRemoved: () => void
}) {
  const [removing, setRemoving] = useState(false)
  const refresh = useFeedAction(workspace.id, "refresh")
  const remove = useFeedAction(workspace.id, "remove")
  const canEdit = workspace.role !== "viewer"

  return (
    <>
      <div {...stylex.props(styles.toolbar)}>
        <span {...stylex.props(styles.refreshed)}>
          {feed.lastFetchedAt
            ? `Last refreshed ${formatArticleDate(feed.lastFetchedAt)}`
            : "Not refreshed yet"}
        </span>
        {canEdit ? (
          <>
            <Button
              disabled={refresh.isPending}
              onClick={() => refresh.mutate(feed.id)}
            >
              <RefreshCwIcon
                {...stylex.props(styles.icon)}
                aria-hidden="true"
              />
              {refresh.isPending ? "Refreshing…" : "Refresh"}
            </Button>
            <Button
              variant="ghost"
              xstyle={styles.iconButton}
              aria-label={`Remove ${feed.title}`}
              onClick={() => {
                remove.reset()
                setRemoving(true)
              }}
            >
              <Trash2Icon {...stylex.props(styles.icon)} aria-hidden="true" />
            </Button>
          </>
        ) : null}
      </div>
      {feed.error ? (
        <p role="alert" {...stylex.props(styles.error)}>
          Feed refresh failed: {feed.error}
        </p>
      ) : null}
      {refresh.isError ? (
        <p role="alert" {...stylex.props(styles.error)}>
          {refresh.error.message}
        </p>
      ) : null}
      <Modal
        open={removing}
        onOpenChange={setRemoving}
        title="Remove this feed?"
        description={`Remove ${feed.title} from ${workspace.name}. This affects everyone in the workspace.`}
      >
        <div {...stylex.props(styles.dialogActions)}>
          <Button onClick={() => setRemoving(false)}>Keep feed</Button>
          <Button
            variant="destructive-outline"
            disabled={remove.isPending}
            onClick={() => {
              remove.mutate(feed.id, {
                onSuccess: () => {
                  setRemoving(false)
                  onRemoved()
                },
              })
            }}
          >
            {remove.isPending ? "Removing…" : "Remove feed"}
          </Button>
        </div>
        {remove.isError ? (
          <p role="alert" {...stylex.props(styles.error)}>
            {remove.error.message}
          </p>
        ) : null}
      </Modal>
    </>
  )
}
