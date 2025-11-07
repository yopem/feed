"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  BookmarkIcon,
  ExternalLinkIcon,
  Share2Icon,
  StarIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useTRPC } from "@/lib/trpc/client"

interface ArticleActionsProps {
  articleId: string
  isStarred: boolean
  isReadLater: boolean
  link: string
  feedSlug?: string
  articleSlug?: string
}

export function ArticleActions({
  articleId,
  isStarred,
  isReadLater,
  link,
  feedSlug,
  articleSlug,
}: ArticleActionsProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const updateStarred = useMutation(
    trpc.article.updateStarred.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.article.pathFilter())
        await queryClient.invalidateQueries(trpc.feed.pathFilter())
      },
    }),
  )

  const updateReadLater = useMutation(
    trpc.article.updateReadLater.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.article.pathFilter())
        await queryClient.invalidateQueries(trpc.feed.pathFilter())
      },
    }),
  )

  const handleShare = async () => {
    if (!feedSlug || !articleSlug) {
      toast.error("Unable to share this article")
      return
    }

    const shareUrl = `${window.location.origin}/dashboard/${feedSlug}/${articleSlug}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Link copied to clipboard!")
    } catch {
      toast.error("Failed to copy link")
    }
  }

  return (
    <div className="panel-header flex items-center justify-between">
      <div className="flex items-center gap-2">
        {/* Star/Unstar */}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() =>
            updateStarred.mutate({ id: articleId, isStarred: !isStarred })
          }
          title={isStarred ? "Remove star" : "Add star"}
          aria-label={isStarred ? "Remove star" : "Add star"}
        >
          <StarIcon
            className="text-primary h-5 w-5"
            fill={isStarred ? "currentColor" : "none"}
          />
        </Button>

        {/* Read Later */}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() =>
            updateReadLater.mutate({
              id: articleId,
              isReadLater: !isReadLater,
            })
          }
          title={isReadLater ? "Remove from read later" : "Read later"}
          aria-label={isReadLater ? "Remove from read later" : "Read later"}
        >
          <BookmarkIcon
            className="text-primary h-5 w-5"
            fill={isReadLater ? "currentColor" : "none"}
          />
        </Button>

        {/* Share */}
        {feedSlug && articleSlug && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleShare}
            title="Share article"
            aria-label="Share article"
          >
            <Share2Icon className="text-muted-foreground h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Open Original Link */}
      <Button asChild variant="secondary">
        <a href={link} target="_blank" rel="noopener noreferrer">
          <span>Open Original</span>
          <ExternalLinkIcon className="ml-2 h-4 w-4" />
        </a>
      </Button>
    </div>
  )
}
