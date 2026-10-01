import * as stylex from "@stylexjs/stylex"
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
import { tokens } from "ui/styles/tokens.stylex"

const styles = stylex.create({
  popup: {
    maxInlineSize: 800,
    overflowY: "auto",
    overscrollBehavior: "contain",
    padding: 0,
  },
  header: {
    display: "flex",
    flexWrap: "wrap",
    flexShrink: 0,
    alignItems: "center",
    gap: 12,
    paddingBlock: 18,
    paddingInlineStart: 24,
    paddingInlineEnd: 56,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: tokens["--border"],
  },
  feedTitle: { fontSize: 14, fontWeight: 500 },
  caption: { color: tokens["--muted-foreground"], fontSize: 12 },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    flexShrink: 0,
    gap: 8,
    paddingBlock: 12,
    paddingInline: { default: 24, "@media (max-width: 700px)": 16 },
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: tokens["--border"],
    backgroundColor: tokens["--muted"],
  },
  pressed: { backgroundColor: tokens["--accent"] },
  icon: {
    width: { default: 18, "@media (min-width: 640px)": 16 },
    height: { default: 18, "@media (min-width: 640px)": 16 },
    flexShrink: 0,
  },
  error: {
    flexShrink: 0,
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
  shareMessage: {
    display: { default: "block", ":empty": "none" },
    flexShrink: 0,
    paddingInline: 24,
    color: tokens["--muted-foreground"],
    fontSize: 12,
  },
  document: {
    flexShrink: 0,
    maxWidth: 680,
    width: "100%",
    marginInline: "auto",
    paddingTop: { default: 28, "@media (max-width: 700px)": 24 },
    paddingInline: { default: 32, "@media (max-width: 700px)": 24 },
    paddingBottom: { default: 40, "@media (max-width: 700px)": 24 },
  },
  title: {
    fontSize: "clamp(24px, 3vw, 32px)",
    lineHeight: 1.25,
    letterSpacing: "-0.8px",
  },
  byline: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 18,
    marginBottom: 28,
    fontSize: 12,
    color: tokens["--muted-foreground"],
  },
  content: {
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    fontSize: 17,
    lineHeight: 1.85,
  },
  originalLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    marginTop: 28,
    color: tokens["--foreground"],
    fontSize: 13,
    textDecorationLine: "underline",
    textUnderlineOffset: 4,
    ":focus-visible": {
      outlineColor: tokens["--foreground"],
      outlineStyle: "solid",
      outlineWidth: 2,
      outlineOffset: 3,
    },
  },
  linkIcon: { width: 18, height: 18, flexShrink: 0 },
  muted: { margin: 0, color: tokens["--muted-foreground"] },
})

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
        xstyle={styles.popup}
        bottomStickOnMobile={false}
        closeProps={{ "aria-label": "Close article" }}
      >
        <header {...stylex.props(styles.header)}>
          <span {...stylex.props(styles.feedTitle)}>{article.feedTitle}</span>
          <span {...stylex.props(styles.caption)}>Article reader</span>
        </header>
        <div {...stylex.props(styles.actions)}>
          <Button
            size="sm"
            disabled={mutation.isPending}
            aria-pressed={current.read}
            xstyle={current.read && styles.pressed}
            onClick={() => update({ read: !current.read })}
          >
            {current.read ? (
              <CheckIcon {...stylex.props(styles.icon)} aria-hidden="true" />
            ) : (
              <CircleIcon {...stylex.props(styles.icon)} aria-hidden="true" />
            )}
            {current.read ? "Mark unread" : "Mark read"}
          </Button>
          <Button
            size="sm"
            disabled={mutation.isPending}
            aria-pressed={current.starred}
            xstyle={current.starred && styles.pressed}
            onClick={() => update({ starred: !current.starred })}
          >
            <StarIcon {...stylex.props(styles.icon)} aria-hidden="true" />
            {current.starred ? "Unstar" : "Star"}
          </Button>
          <Button
            size="sm"
            disabled={mutation.isPending}
            aria-pressed={current.saved}
            xstyle={current.saved && styles.pressed}
            onClick={() => update({ saved: !current.saved })}
          >
            <BookmarkIcon {...stylex.props(styles.icon)} aria-hidden="true" />
            {current.saved ? "Unsave" : "Read later"}
          </Button>
          {url ? (
            <Button size="sm" onClick={() => void share()}>
              <Share2Icon {...stylex.props(styles.icon)} aria-hidden="true" />
              Share
            </Button>
          ) : null}
        </div>
        {mutation.isError ? (
          <p role="alert" {...stylex.props(styles.error)}>
            {mutation.error.message}
          </p>
        ) : null}
        <output {...stylex.props(styles.shareMessage)}>{shareMessage}</output>
        <div {...stylex.props(styles.document)}>
          <DialogTitle xstyle={styles.title}>
            {article.title || "Untitled article"}
          </DialogTitle>
          <div {...stylex.props(styles.byline)}>
            <span>{article.feedTitle}</span>
            {article.publishedAt ? (
              <time dateTime={article.publishedAt}>
                {formatArticleDate(article.publishedAt)}
              </time>
            ) : null}
          </div>
          <article {...stylex.props(styles.content)}>
            {article.content ||
              "This feed has no article text. Read the full story at the original source."}
          </article>
          {url ? (
            <a
              {...stylex.props(styles.originalLink)}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read original article{" "}
              <ExternalLinkIcon
                {...stylex.props(styles.linkIcon)}
                aria-hidden="true"
              />
            </a>
          ) : (
            <p {...stylex.props(styles.muted)}>
              Original article link unavailable.
            </p>
          )}
        </div>
      </DialogPopup>
    </Dialog>
  )
}
