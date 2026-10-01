import {
  BookmarkIcon,
  CheckIcon,
  CircleIcon,
  ExternalLinkIcon,
  Share2Icon,
  StarIcon,
} from "lucide-react"
import { useState } from "react"
import { articleUrl } from "web/features/reader/article-url"
import { formatArticleDate } from "web/features/reader/format-date"

import type { Article, ArticleState } from "rpc/reader"
import { useArticleState } from "rpc/reader"
import { Button } from "ui/button"
import { Dialog, DialogPopup, DialogTitle } from "ui/dialog"

export function ArticleDetail({
  article,
  workspaceId,
  onClose,
}: {
  article: Article
  workspaceId: string
  onClose: () => void
}) {
  const [open, setOpen] = useState(true)
  const [current, setCurrent] = useState(article)
  const [shareMessage, setShareMessage] = useState("")
  const mutation = useArticleState(workspaceId)
  const url = articleUrl(article.url)

  function update(state: Pick<ArticleState, "read" | "starred" | "saved">) {
    mutation.mutate(
      { articleId: article.id, ...state },
      {
        onSuccess: () => setCurrent((previous) => ({ ...previous, ...state })),
      },
    )
  }

  async function share() {
    if (!url) return
    setShareMessage("")

    try {
      if (navigator.share) {
        await navigator.share({ title: article.title, url })
      } else {
        await navigator.clipboard.writeText(url)
        setShareMessage("Link copied.")
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return
      setShareMessage("Could not share. Copy the original article link below.")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogPopup
        className="article-dialog max-w-[800px]"
        bottomStickOnMobile={false}
        closeProps={{ "aria-label": "Close article" }}
      >
        <header className="reader-overlay-header">
          <span className="text-sm font-medium">{article.feedTitle}</span>
          <span className="text-muted-foreground text-xs">Article reader</span>
        </header>
        <div className="article-actions">
          <Button
            size="sm"
            disabled={mutation.isPending}
            aria-pressed={current.read}
            onClick={() => update({ read: !current.read })}
          >
            {current.read ? (
              <CheckIcon aria-hidden="true" />
            ) : (
              <CircleIcon aria-hidden="true" />
            )}
            {current.read ? "Mark unread" : "Mark read"}
          </Button>
          <Button
            size="sm"
            disabled={mutation.isPending}
            aria-pressed={current.starred}
            onClick={() => update({ starred: !current.starred })}
          >
            <StarIcon aria-hidden="true" />
            {current.starred ? "Unstar" : "Star"}
          </Button>
          <Button
            size="sm"
            disabled={mutation.isPending}
            aria-pressed={current.saved}
            onClick={() => update({ saved: !current.saved })}
          >
            <BookmarkIcon aria-hidden="true" />
            {current.saved ? "Unsave" : "Read later"}
          </Button>
          {url ? (
            <Button size="sm" onClick={() => void share()}>
              <Share2Icon aria-hidden="true" />
              Share
            </Button>
          ) : null}
        </div>
        {mutation.isError ? (
          <p role="alert" className="error-message">
            {mutation.error.message}
          </p>
        ) : null}
        <output className="share-message">{shareMessage}</output>
        <div className="reader-document">
          <DialogTitle className="reader-title">
            {article.title || "Untitled article"}
          </DialogTitle>
          <div className="article-byline">
            <span>{article.feedTitle}</span>
            {article.publishedAt ? (
              <time dateTime={article.publishedAt}>
                {formatArticleDate(article.publishedAt)}
              </time>
            ) : null}
          </div>
          <article className="article-content">
            {article.content ||
              "This feed has no article text. Read the full story at the original source."}
          </article>
          {url ? (
            <a
              className="original-link"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read original article <ExternalLinkIcon aria-hidden="true" />
            </a>
          ) : (
            <p className="muted">Original article link unavailable.</p>
          )}
        </div>
      </DialogPopup>
    </Dialog>
  )
}
