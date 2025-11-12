"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  BarChart3Icon,
  BookmarkIcon,
  ExternalLinkIcon,
  Share2Icon,
  StarIcon,
} from "lucide-react"

import { ShareAnalyticsDialog } from "@/components/article/share-analytics-dialog"
import { ShareSettingsDialog } from "@/components/article/share-settings-dialog"
import { Button } from "@/components/ui/button"
import { useTRPC } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"

interface ArticleActionsProps {
  articleId: string
  articleTitle: string
  isStarred: boolean
  isReadLater: boolean
  link: string
  feedSlug?: string
  articleSlug?: string
}

export function ArticleActions({
  articleId,
  articleTitle,
  isStarred,
  isReadLater,
  link,
}: ArticleActionsProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false)
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: article } = useQuery({
    ...trpc.article.byId.queryOptions(articleId),
    enabled: !!articleId,
  })

  const updateStarred = useMutation(
    trpc.article.updateStarred.mutationOptions({
      onSuccess: async (data) => {
        // Only invalidate queries for this specific article
        // This prevents cascading invalidations to other components
        if (data?.id && articleId) {
          await queryClient.invalidateQueries({
            predicate: (query) => {
              const queryKey = query.queryKey as unknown[]
              return Boolean(
                queryKey[0] === "article" &&
                  queryKey[1] === "byId" &&
                  queryKey[2] &&
                  typeof queryKey[2] === "object" &&
                  "input" in queryKey[2] &&
                  queryKey[2].input === articleId,
              )
            },
          })
        }
        await queryClient.invalidateQueries(trpc.feed.pathFilter())
      },
    }),
  )

  const updateReadLater = useMutation(
    trpc.article.updateReadLater.mutationOptions({
      onSuccess: async (data) => {
        // Only invalidate queries for this specific article
        // This prevents cascading invalidations to other components
        if (data?.id && articleId) {
          await queryClient.invalidateQueries({
            predicate: (query) => {
              const queryKey = query.queryKey as unknown[]
              return Boolean(
                queryKey[0] === "article" &&
                  queryKey[1] === "byId" &&
                  queryKey[2] &&
                  typeof queryKey[2] === "object" &&
                  "input" in queryKey[2] &&
                  queryKey[2].input === articleId,
              )
            },
          })
        }
        await queryClient.invalidateQueries(trpc.feed.pathFilter())
      },
    }),
  )

  const handleShare = () => {
    setIsShareDialogOpen(true)
  }

  return (
    <div className="border-border flex items-center justify-between border-b-2 px-4 py-3 md:px-6">
      <div className="flex items-center gap-1.5">
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

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={handleShare}
          title="Share article publicly"
          aria-label="Share article publicly"
        >
          <Share2Icon className="text-muted-foreground hover:text-foreground h-5 w-5 transition-colors" />
        </Button>

        {article?.isPubliclyShared && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setIsAnalyticsDialogOpen(true)}
            title="View share analytics"
            aria-label="View share analytics"
          >
            <BarChart3Icon className="text-muted-foreground hover:text-foreground h-5 w-5 transition-colors" />
          </Button>
        )}
      </div>

      <Button asChild variant="secondary">
        <a href={link} target="_blank" rel="noopener noreferrer">
          <span>Open Original</span>
          <ExternalLinkIcon className="ml-2 h-4 w-4" />
        </a>
      </Button>

      <ShareSettingsDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        articleId={articleId}
        articleTitle={articleTitle}
      />

      <ShareAnalyticsDialog
        isOpen={isAnalyticsDialogOpen}
        onClose={() => setIsAnalyticsDialogOpen(false)}
        articleId={articleId}
        articleTitle={articleTitle}
      />
    </div>
  )
}
