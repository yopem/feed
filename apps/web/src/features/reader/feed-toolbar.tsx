import { RefreshCwIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import { formatArticleDate } from "web/features/reader/format-date"

import type { Workspace, useFeeds } from "rpc/reader"
import { useFeedAction } from "rpc/reader"
import { Button } from "ui/button"
import { Modal } from "ui/dialog"

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
      <div className="feed-toolbar">
        <span>
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
              <RefreshCwIcon aria-hidden="true" />
              {refresh.isPending ? "Refreshing…" : "Refresh"}
            </Button>
            <Button
              variant="ghost"
              className="icon-button"
              aria-label={`Remove ${feed.title}`}
              onClick={() => {
                remove.reset()
                setRemoving(true)
              }}
            >
              <Trash2Icon aria-hidden="true" />
            </Button>
          </>
        ) : null}
      </div>
      {feed.error ? (
        <p role="alert" className="error-message">
          Feed refresh failed: {feed.error}
        </p>
      ) : null}
      {refresh.isError ? (
        <p role="alert" className="error-message">
          {refresh.error.message}
        </p>
      ) : null}
      <Modal
        open={removing}
        onOpenChange={setRemoving}
        title="Remove this feed?"
        description={`Remove ${feed.title} from ${workspace.name}. This affects everyone in the workspace.`}
      >
        <div className="dialog-actions">
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
          <p role="alert" className="error-message">
            {remove.error.message}
          </p>
        ) : null}
      </Modal>
    </>
  )
}
