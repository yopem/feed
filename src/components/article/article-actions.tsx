"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { BookmarkIcon, ExternalLinkIcon, StarIcon } from "lucide-react"

import { SocialShareButtons } from "@/components/article/social-share-buttons"
import { Button } from "@/components/ui/button"
import { useTRPC } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"

interface ArticleActionsProps {
  articleId: string
  articleTitle: string
  isFavorited: boolean
  isReadLater: boolean
  link: string
}

export function ArticleActions({
  articleId,
  articleTitle,
  isFavorited,
  isReadLater,
  link,
}: ArticleActionsProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: article } = useQuery({
    ...trpc.article.byId.queryOptions(articleId),
    enabled: !!articleId,
  })

  const updateFavorited = useMutation(
    trpc.article.updateFavorited.mutationOptions({
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

  const currentIsFavorited = article?.isFavorited ?? isFavorited
  const currentIsReadLater = article?.isReadLater ?? isReadLater

  return (
    <div className="border-border flex items-center justify-between border-b-2 px-4 py-3 md:px-6">
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() =>
            updateFavorited.mutate({
              id: articleId,
              isFavorited: !currentIsFavorited,
            })
          }
          title={
            currentIsFavorited ? "Remove from favorites" : "Add to favorites"
          }
          aria-label={
            currentIsFavorited ? "Remove from favorites" : "Add to favorites"
          }
        >
          <StarIcon
            className={cn(
              "h-5 w-5 transition-colors",
              currentIsFavorited
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
              isReadLater: !currentIsReadLater,
            })
          }
          title={currentIsReadLater ? "Remove from read later" : "Read later"}
          aria-label={
            currentIsReadLater ? "Remove from read later" : "Read later"
          }
        >
          <BookmarkIcon
            className={cn(
              "h-5 w-5 transition-colors",
              currentIsReadLater
                ? "fill-blue-500 text-blue-500 dark:fill-blue-400 dark:text-blue-400"
                : "text-muted-foreground hover:text-foreground",
            )}
          />
        </Button>

        <SocialShareButtons url={link} title={articleTitle} />
      </div>

      <Button
        variant="secondary"
        render={<a href={link} target="_blank" rel="noopener noreferrer" />}
      >
        <span>Open Original</span>
        <ExternalLinkIcon className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}
