import * as stylex from "@stylexjs/stylex"
import {
  BookmarkIcon,
  CheckCheckIcon,
  ChevronRightIcon,
  PlusIcon,
  RssIcon,
  StarIcon,
} from "lucide-react"
import { formatArticleDate } from "web/features/reader/format-date"

import type { Article, ArticleFilter, useArticles } from "rpc/reader"
import { Button } from "ui/button"
import { tokens } from "ui/styles/tokens.stylex"

const styles = stylex.create({
  loading: {
    display: "block",
    padding: 24,
    color: tokens["--muted-foreground"],
    fontSize: 12,
  },
  placeholder: {
    display: "block",
    height: 66,
    marginBottom: 16,
    backgroundColor: tokens["--muted"],
    borderRadius: 8,
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 14,
    textAlign: "center",
    paddingBlock: 72,
    paddingInline: 24,
  },
  emptyTitle: { margin: 0, fontSize: 18, fontWeight: 600 },
  emptyDescription: {
    margin: 0,
    maxWidth: 340,
    color: tokens["--muted-foreground"],
    fontSize: 13,
    lineHeight: 1.7,
  },
  emptyIcon: {
    display: "grid",
    placeItems: "center",
    width: 48,
    height: 48,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens["--border"],
    backgroundColor: tokens["--muted"],
    borderRadius: 12,
  },
  icon: { width: 18, height: 18, flexShrink: 0 },
  controlIcon: {
    width: { default: 18, "@media (min-width: 640px)": 16 },
    height: { default: 18, "@media (min-width: 640px)": 16 },
    flexShrink: 0,
  },
  rows: { listStyle: "none", margin: 0, padding: 0 },
  item: {
    borderTopWidth: { default: 0, ":not(:first-child)": 1 },
    borderTopStyle: "solid",
    borderTopColor: tokens["--border"],
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: { default: 16, "@media (max-width: 700px)": 10 },
    width: "100%",
    paddingBlock: { default: 20, "@media (max-width: 700px)": 16 },
    paddingInline: { default: 20, "@media (max-width: 700px)": 12 },
    textAlign: "left",
    borderWidth: 0,
    fontFamily: "inherit",
    cursor: "pointer",
    backgroundColor: {
      default: "transparent",
      ":hover": {
        default: null,
        "@media (hover: hover) and (pointer: fine)": tokens["--muted"],
      },
    },
    color: tokens["--foreground"],
    transitionProperty: "background-color",
    transitionDuration: {
      default: "120ms",
      "@media (prefers-reduced-motion: reduce)": "0ms",
    },
    transitionTimingFunction: "ease-out",
    ":focus-visible": {
      outlineWidth: 2,
      outlineStyle: "solid",
      outlineColor: tokens["--foreground"],
      outlineOffset: -3,
    },
  },
  sourceTile: {
    display: { default: "grid", "@media (max-width: 700px)": "none" },
    placeItems: "center",
    width: 38,
    height: 38,
    flexShrink: 0,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens["--border"],
    borderRadius: 10,
    color: tokens["--muted-foreground"],
    backgroundColor: tokens["--muted"],
  },
  body: { flex: 1, minWidth: 0 },
  title: {
    display: "block",
    fontSize: 15,
    lineHeight: 1.5,
    fontWeight: 600,
    overflowWrap: "anywhere",
  },
  readTitle: { fontWeight: 450, color: tokens["--muted-foreground"] },
  excerpt: {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 1,
    overflow: "hidden",
    color: tokens["--muted-foreground"],
    fontSize: 13,
    lineHeight: 1.7,
    marginTop: 4,
    overflowWrap: "anywhere",
  },
  source: {
    display: "flex",
    alignItems: "center",
    flexWrap: { default: "nowrap", "@media (max-width: 700px)": "wrap" },
    gap: 7,
    marginTop: 10,
    color: tokens["--muted-foreground"],
    fontSize: 11,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    flexShrink: 0,
    backgroundColor: tokens["--foreground"],
  },
  readDot: { backgroundColor: tokens["--border"] },
  feedTitle: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: { default: null, "@media (max-width: 700px)": 140 },
  },
  stateIcon: { width: 12, height: 12, flexShrink: 0 },
  date: { marginLeft: "auto", flexShrink: 0 },
  chevron: {
    display: { default: "block", "@media (max-width: 700px)": "none" },
    width: 14,
    height: 18,
    flexShrink: 0,
    color: tokens["--muted-foreground"],
  },
  listEnd: {
    margin: 0,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: tokens["--border"],
    padding: 15,
    backgroundColor: tokens["--muted"],
    textAlign: "center",
    color: tokens["--muted-foreground"],
    fontSize: 11,
  },
})

export function ArticleResults({
  articles,
  noFeeds,
  search,
  view,
  canEdit,
  onAdd,
  onSelect,
}: {
  articles: ReturnType<typeof useArticles>
  noFeeds: boolean
  search: string
  view: ArticleFilter["view"]
  canEdit: boolean
  onAdd: () => void
  onSelect: (article: Article) => void
}) {
  return (
    <>
      {articles.isPending ? (
        <output {...stylex.props(styles.loading)} aria-label="Loading articles">
          <span {...stylex.props(styles.placeholder)} aria-hidden="true" />
          <span {...stylex.props(styles.placeholder)} aria-hidden="true" />
          <span {...stylex.props(styles.placeholder)} aria-hidden="true" />
          <span>Loading your articles…</span>
        </output>
      ) : null}
      {articles.isError ? (
        <div {...stylex.props(styles.empty)}>
          <h2 {...stylex.props(styles.emptyTitle)}>Could not load articles</h2>
          <p role="alert" {...stylex.props(styles.emptyDescription)}>
            {articles.error.message}
          </p>
          <Button onClick={() => void articles.refetch()}>Try again</Button>
        </div>
      ) : null}
      {articles.data?.length === 0 ? (
        <EmptyArticles
          noFeeds={noFeeds}
          search={search}
          view={view}
          canEdit={canEdit}
          onAdd={onAdd}
        />
      ) : null}
      <ul {...stylex.props(styles.rows)}>
        {articles.data?.map((item) => (
          <li key={item.id} {...stylex.props(styles.item)}>
            <ArticleRow article={item} onSelect={onSelect} />
          </li>
        ))}
      </ul>
      {articles.data && articles.data.length > 0 ? (
        <p {...stylex.props(styles.listEnd)}>
          You're at the end of this reading list.
        </p>
      ) : null}
    </>
  )
}

function ArticleRow({
  article,
  onSelect,
}: {
  article: Article
  onSelect: (article: Article) => void
}) {
  return (
    <button
      type="button"
      {...stylex.props(styles.row)}
      aria-label={`${article.title || "Untitled article"}. ${article.feedTitle}. ${article.read ? "Read" : "Unread"}`}
      onClick={() => onSelect(article)}
    >
      <span {...stylex.props(styles.sourceTile)} aria-hidden="true">
        <RssIcon {...stylex.props(styles.icon)} />
      </span>
      <span {...stylex.props(styles.body)}>
        <span {...stylex.props(styles.title, article.read && styles.readTitle)}>
          {article.title || "Untitled article"}
        </span>
        <span {...stylex.props(styles.excerpt)}>
          {article.content.slice(0, 280)}
        </span>
        <span {...stylex.props(styles.source)}>
          <span
            {...stylex.props(styles.dot, article.read && styles.readDot)}
            aria-hidden="true"
          />
          <span {...stylex.props(styles.feedTitle)}>{article.feedTitle}</span>
          <span aria-hidden="true">·</span>
          <span>{article.read ? "Read" : "Unread"}</span>
          {article.starred ? (
            <StarIcon
              {...stylex.props(styles.stateIcon)}
              aria-label="Starred"
            />
          ) : null}
          {article.saved ? (
            <BookmarkIcon
              {...stylex.props(styles.stateIcon)}
              aria-label="Saved for later"
            />
          ) : null}
          {article.publishedAt ? (
            <time {...stylex.props(styles.date)} dateTime={article.publishedAt}>
              {formatArticleDate(article.publishedAt)}
            </time>
          ) : null}
        </span>
      </span>
      <ChevronRightIcon {...stylex.props(styles.chevron)} aria-hidden="true" />
    </button>
  )
}

const emptyMessages = {
  all: "Refresh a feed to check for new stories.",
  starred: "Star an article to keep it here.",
  saved: "Save an article to come back to it later.",
  unread: "You're all caught up. New stories will appear here.",
}

function EmptyArticles({
  noFeeds,
  search,
  view,
  canEdit,
  onAdd,
}: {
  noFeeds: boolean
  search: string
  view: ArticleFilter["view"]
  canEdit: boolean
  onAdd: () => void
}) {
  return (
    <div {...stylex.props(styles.empty)}>
      <span {...stylex.props(styles.emptyIcon)}>
        {noFeeds ? (
          <RssIcon {...stylex.props(styles.icon)} aria-hidden="true" />
        ) : (
          <CheckCheckIcon {...stylex.props(styles.icon)} aria-hidden="true" />
        )}
      </span>
      <h2 {...stylex.props(styles.emptyTitle)}>
        {noFeeds
          ? "Make room for good reading."
          : search
            ? "No matching articles"
            : "Nothing here just yet."}
      </h2>
      <p {...stylex.props(styles.emptyDescription)}>
        {noFeeds
          ? "Add an RSS feed to start your own daily reading list."
          : search
            ? "Try a different search or clear it to see all articles."
            : emptyMessages[view ?? "all"]}
      </p>
      {canEdit && noFeeds ? (
        <Button variant="default" onClick={() => onAdd()}>
          <PlusIcon {...stylex.props(styles.controlIcon)} aria-hidden="true" />
          Add your first feed
        </Button>
      ) : null}
    </div>
  )
}
