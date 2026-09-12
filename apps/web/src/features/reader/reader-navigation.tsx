import { LibraryIcon, PlusIcon, RssIcon } from "lucide-react"
import { useId } from "react"

import type { ArticleFilter, Workspace } from "rpc/reader"
import { useFeeds } from "rpc/reader"
import { Button } from "ui/button"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "ui/select"

export function ReaderNavigation({
  workspace,
  workspaces,
  feedId,
  onSwitch,
  onCreate,
  onView,
  onFeed,
  onAdd,
  onNavigate,
}: {
  workspace: Workspace
  workspaces: Workspace[]
  feedId?: string
  onSwitch: (id: string) => void
  onCreate: () => void
  onView: (view: ArticleFilter["view"]) => void
  onFeed: (id: string) => void
  onAdd: () => void
  onNavigate: () => void
}) {
  const id = useId()
  const feeds = useFeeds(workspace.id)
  const canEdit = workspace.role !== "viewer"
  return (
    <>
      <div className="workspace-picker">
        <label htmlFor={id}>Workspace</label>
        <Select
          value={workspace.id}
          items={workspaces.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
          onValueChange={(value) => {
            if (value) onSwitch(value)
          }}
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup alignItemWithTrigger={false}>
            {workspaces.map((item) => (
              <SelectItem value={item.id} key={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          className="new-workspace"
          onClick={() => {
            onNavigate()
            onCreate()
          }}
        >
          <PlusIcon aria-hidden="true" /> New workspace
        </Button>
      </div>
      <nav aria-label="Reading views" className="reading-nav">
        <Button
          variant="ghost"
          className={`nav-item justify-start ${!feedId ? "active" : ""}`}
          aria-current={!feedId ? "page" : undefined}
          onClick={() => onView("all")}
        >
          <LibraryIcon aria-hidden="true" />
          <span>Your reading</span>
        </Button>
      </nav>
      <div className="feed-heading">
        <span>Feeds</span>
        {canEdit ? (
          <Button
            variant="ghost"
            className="icon-button"
            aria-label="Add feed"
            title="Add feed"
            onClick={() => {
              onAdd()
            }}
          >
            <PlusIcon aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      <nav aria-label="Feeds" className="feed-nav">
        {feeds.isPending ? (
          <p className="sidebar-note" role="status">
            Loading feeds…
          </p>
        ) : null}
        {feeds.isError ? (
          <div className="sidebar-note">
            <p role="alert">Could not load feeds.</p>
            <Button onClick={() => void feeds.refetch()}>Try again</Button>
          </div>
        ) : null}
        {feeds.data?.map((feed) => (
          <Button
            variant="ghost"
            className={`nav-item justify-start ${feedId === feed.id ? "active" : ""}`}
            aria-current={feedId === feed.id ? "page" : undefined}
            key={feed.id}
            onClick={() => {
              onFeed(feed.id)
            }}
          >
            <RssIcon aria-hidden="true" />
            <span>{feed.title}</span>
            {feed.error ? (
              <span
                className="feed-warning"
                aria-label="Feed has a refresh error"
              >
                !
              </span>
            ) : null}
          </Button>
        ))}
        {feeds.data?.length === 0 ? (
          <p className="sidebar-note">Your favorite sources belong here.</p>
        ) : null}
      </nav>
      {!canEdit ? <p className="sidebar-note">View-only workspace</p> : null}
    </>
  )
}
