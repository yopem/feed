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
import { cn } from "@/lib/utils"

interface ArticleActionsProps {
  articleId: string
  isStarred: boolean
  isReadLater: boolean
  link: string
  feedSlug?: string
  articleSlug?: string
  username?: string
}

export function ArticleActions({
  articleId,
  isStarred,
  isReadLater,
  link,
  feedSlug,
  articleSlug,
  username,
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
    if (!feedSlug || !articleSlug || !username) {
      toast.error("Unable to share this article")
      return
    }

    const shareUrl = `${window.location.origin}/${username}/${feedSlug}/${articleSlug}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Link copied to clipboard!")
    } catch {
      toast.error("Failed to copy link")
    }
  }

  return (
    <div className="panel-header flex items-center justify-between border-b px-4 py-3 md:px-6">
      <div className="flex items-center gap-1.5">
        {/* Star/Unstar */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() =>
            updateStarred.mutate({ id: articleId, isStarred: !isStarred })
          }
          title={isStarred ? "Remove star" : "Add star"}
          aria-label={isStarred ? "Remove star" : "Add star"}
        >
          <StarIcon
            className={cn(
              "h-5 w-5 transition-colors",
              isStarred
                ? "fill-yellow-500 text-yellow-500 dark:fill-yellow-400 dark:text-yellow-400"
                : "text-muted-foreground hover:text-foreground",
            )}
          />
        </Button>

        {/* Read Later */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
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
            className={cn(
              "h-5 w-5 transition-colors",
              isReadLater
                ? "fill-blue-500 text-blue-500 dark:fill-blue-400 dark:text-blue-400"
                : "text-muted-foreground hover:text-foreground",
            )}
          />
        </Button>

        {/* Share */}
        {feedSlug && articleSlug && username && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={handleShare}
            title="Share article"
            aria-label="Share article"
          >
            <Share2Icon className="text-muted-foreground hover:text-foreground h-5 w-5 transition-colors" />
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
