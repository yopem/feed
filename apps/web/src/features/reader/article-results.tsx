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
        <output className="loading-list" aria-label="Loading articles">
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span>Loading your articles…</span>
        </output>
      ) : null}
      {articles.isError ? (
        <div className="empty-state">
          <h2>Could not load articles</h2>
          <p role="alert">{articles.error.message}</p>
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
      <ul className="article-rows">
        {articles.data?.map((item) => (
          <li key={item.id}>
            <ArticleRow article={item} onSelect={onSelect} />
          </li>
        ))}
      </ul>
      {articles.data && articles.data.length > 0 ? (
        <p className="list-end">You're at the end of this reading list.</p>
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
      className={`article-row ${article.read ? "is-read" : ""}`}
      aria-label={`${article.title || "Untitled article"}. ${article.feedTitle}. ${article.read ? "Read" : "Unread"}`}
      onClick={() => onSelect(article)}
    >
      <span className="source-tile" aria-hidden="true">
        <RssIcon />
      </span>
      <span className="article-row-body">
        <span className="article-title">
          {article.title || "Untitled article"}
        </span>
        <span className="article-excerpt">{article.content.slice(0, 280)}</span>
        <span className="article-source">
          <span
            className={`article-dot ${article.read ? "read-dot" : ""}`}
            aria-hidden="true"
          />
          <span className="truncate">{article.feedTitle}</span>
          <span aria-hidden="true">·</span>
          <span>{article.read ? "Read" : "Unread"}</span>
          {article.starred ? <StarIcon aria-label="Starred" /> : null}
          {article.saved ? <BookmarkIcon aria-label="Saved for later" /> : null}
          {article.publishedAt ? (
            <time className="article-date" dateTime={article.publishedAt}>
              {formatArticleDate(article.publishedAt)}
            </time>
          ) : null}
        </span>
      </span>
      <ChevronRightIcon className="row-chevron" aria-hidden="true" />
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
    <div className="empty-state">
      <span className="empty-icon">
        {noFeeds ? (
          <RssIcon aria-hidden="true" />
        ) : (
          <CheckCheckIcon aria-hidden="true" />
        )}
      </span>
      <h2>
        {noFeeds
          ? "Make room for good reading."
          : search
            ? "No matching articles"
            : "Nothing here just yet."}
      </h2>
      <p>
        {noFeeds
          ? "Add an RSS feed to start your own daily reading list."
          : search
            ? "Try a different search or clear it to see all articles."
            : emptyMessages[view ?? "all"]}
      </p>
      {canEdit && noFeeds ? (
        <Button variant="default" onClick={() => onAdd()}>
          <PlusIcon aria-hidden="true" /> Add your first feed
        </Button>
      ) : null}
    </div>
  )
}
