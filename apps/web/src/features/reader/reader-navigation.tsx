import { PlusIcon, RssIcon } from "lucide-react"
import { useId } from "react"
import { views } from "web/features/reader/views"

import type { ArticleFilter, Workspace } from "rpc/reader"
import { useFeeds } from "rpc/reader"
import { Button } from "ui/button"

export function ReaderNavigation({
  workspace,
  workspaces,
  view,
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
  view: ArticleFilter["view"]
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
        <select
          id={id}
          value={workspace.id}
          onChange={(event) => onSwitch(event.target.value)}
        >
          {workspaces.map((item) => (
            <option value={item.id} key={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <Button
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
        {views.map((item) => (
          <Button
            key={item.value}
            className={`nav-item ${view === item.value && !feedId ? "active" : ""}`}
            aria-current={view === item.value && !feedId ? "page" : undefined}
            onClick={() => onView(item.value)}
          >
            <item.icon aria-hidden="true" />
            <span>{item.label}</span>
          </Button>
        ))}
      </nav>
      <div className="feed-heading">
        <span>YOUR FEEDS</span>
        {canEdit ? (
          <Button
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
            className={`nav-item ${feedId === feed.id ? "active" : ""}`}
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
      {canEdit ? (
        <Button
          className="add-feed-button"
          onClick={() => {
            onAdd()
          }}
        >
          <PlusIcon aria-hidden="true" /> Follow a feed
        </Button>
      ) : (
        <p className="sidebar-note">View-only workspace</p>
      )}
    </>
  )
}
