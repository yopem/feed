import {
  BookmarkIcon,
  CheckCheckIcon,
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
        <div
          className="loading-list"
          role="status"
          aria-label="Loading articles"
        >
          <div />
          <div />
          <div />
          <span>Loading your articles…</span>
        </div>
      ) : null}
      {articles.isError ? (
        <div className="empty-state">
          <h2>Could not load articles</h2>
          <p role="alert">{articles.error.message}</p>
          <Button onClick={() => void articles.refetch()}>Try again</Button>
        </div>
      ) : null}
      {articles.data?.length === 0 ? (
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
                : view === "starred"
                  ? "Star an article to keep it here."
                  : view === "saved"
                    ? "Save an article to come back to it later."
                    : view === "unread"
                      ? "You're all caught up. New stories will appear here."
                      : "Refresh a feed to check for new stories."}
          </p>
          {canEdit && noFeeds ? (
            <Button className="primary" onClick={() => onAdd()}>
              <PlusIcon aria-hidden="true" /> Add your first feed
            </Button>
          ) : null}
        </div>
      ) : null}
      <div>
        {articles.data?.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`article-row ${item.read ? "is-read" : ""}`}
            aria-label={`${item.title || "Untitled article"}. ${item.feedTitle}. ${item.read ? "Read" : "Unread"}`}
            onClick={() => onSelect(item)}
          >
            <span
              className="article-dot"
              aria-label={item.read ? "Read" : "Unread"}
            />
            <span className="article-row-body">
              <span className="article-source">
                {item.feedTitle}
                {item.starred ? <StarIcon aria-label="Starred" /> : null}
                {item.saved ? (
                  <BookmarkIcon aria-label="Saved for later" />
                ) : null}
              </span>
              <span className="article-title">
                {item.title || "Untitled article"}
              </span>
              <span className="article-excerpt">
                {item.content.slice(0, 280)}
              </span>
            </span>
            <span className="article-date">
              {item.publishedAt ? formatArticleDate(item.publishedAt) : ""}
            </span>
          </button>
        ))}
      </div>
      {articles.data && articles.data.length > 0 ? (
        <p className="list-end">You're at the end of this reading list.</p>
      ) : null}
    </>
  )
}
