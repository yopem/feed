import * as stylex from "@stylexjs/stylex"
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
import { tokens } from "ui/styles/tokens.stylex"

const styles = stylex.create({
  workspacePicker: { display: "grid", gap: 7 },
  workspaceLabel: {
    fontSize: 11,
    color: tokens["--muted-foreground"],
    paddingInline: 8,
  },
  fullWidth: { width: "100%" },
  newWorkspace: { justifySelf: "start", color: tokens["--muted-foreground"] },
  nav: { display: "grid", gap: 3 },
  navItem: {
    width: "100%",
    justifyContent: "flex-start",
    fontSize: 13,
    gap: 9,
  },
  navTitle: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  active: {
    backgroundColor: tokens["--accent"],
    color: tokens["--foreground"],
  },
  feedHeading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 9,
    marginBottom: -14,
    color: tokens["--muted-foreground"],
    fontSize: 12,
  },
  iconButton: { width: 34, paddingInline: 0 },
  icon: {
    width: { default: 18, "@media (min-width: 640px)": 16 },
    height: { default: 18, "@media (min-width: 640px)": 16 },
    flexShrink: 0,
  },
  warning: { marginLeft: "auto", fontWeight: 700 },
  note: {
    margin: 0,
    color: tokens["--muted-foreground"],
    fontSize: 12,
    lineHeight: 1.6,
    padding: 8,
  },
  error: { margin: 0 },
})

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
      <div {...stylex.props(styles.workspacePicker)}>
        <label htmlFor={id} {...stylex.props(styles.workspaceLabel)}>
          Workspace
        </label>
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
          <SelectTrigger id={id} xstyle={styles.fullWidth}>
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
          xstyle={styles.newWorkspace}
          onClick={() => {
            onNavigate()
            onCreate()
          }}
        >
          <PlusIcon {...stylex.props(styles.icon)} aria-hidden="true" />
          New workspace
        </Button>
      </div>
      <nav aria-label="Reading views" {...stylex.props(styles.nav)}>
        <Button
          variant="ghost"
          xstyle={[styles.navItem, !feedId && styles.active]}
          aria-current={!feedId ? "page" : undefined}
          onClick={() => onView("all")}
        >
          <LibraryIcon {...stylex.props(styles.icon)} aria-hidden="true" />
          <span {...stylex.props(styles.navTitle)}>Your reading</span>
        </Button>
      </nav>
      <div {...stylex.props(styles.feedHeading)}>
        <span>Feeds</span>
        {canEdit ? (
          <Button
            variant="ghost"
            xstyle={styles.iconButton}
            aria-label="Add feed"
            title="Add feed"
            onClick={() => {
              onAdd()
            }}
          >
            <PlusIcon {...stylex.props(styles.icon)} aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      <nav aria-label="Feeds" {...stylex.props(styles.nav)}>
        {feeds.isPending ? (
          <output {...stylex.props(styles.note)}>Loading feeds…</output>
        ) : null}
        {feeds.isError ? (
          <div {...stylex.props(styles.note)}>
            <p role="alert" {...stylex.props(styles.error)}>
              Could not load feeds.
            </p>
            <Button onClick={() => void feeds.refetch()}>Try again</Button>
          </div>
        ) : null}
        {feeds.data?.map((feed) => (
          <Button
            variant="ghost"
            xstyle={[styles.navItem, feedId === feed.id && styles.active]}
            aria-current={feedId === feed.id ? "page" : undefined}
            key={feed.id}
            onClick={() => {
              onFeed(feed.id)
            }}
          >
            <RssIcon {...stylex.props(styles.icon)} aria-hidden="true" />
            <span {...stylex.props(styles.navTitle)}>{feed.title}</span>
            {feed.error ? (
              <span
                {...stylex.props(styles.warning)}
                aria-label="Feed has a refresh error"
              >
                !
              </span>
            ) : null}
          </Button>
        ))}
        {feeds.data?.length === 0 ? (
          <p {...stylex.props(styles.note)}>
            Your favorite sources belong here.
          </p>
        ) : null}
      </nav>
      {!canEdit ? (
        <p {...stylex.props(styles.note)}>View-only workspace</p>
      ) : null}
    </>
  )
}
