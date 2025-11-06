"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  CheckCircle2Icon,
  CircleIcon,
  ClockIcon,
  ExternalLinkIcon,
  StarIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTRPC } from "@/lib/trpc/client"

interface ArticleActionsProps {
  articleId: string
  isRead: boolean
  isStarred: boolean
  isReadLater: boolean
  link: string
}

export function ArticleActions({
  articleId,
  isRead,
  isStarred,
  isReadLater,
  link,
}: ArticleActionsProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const updateRead = useMutation(
    trpc.article.updateReadStatus.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.article.pathFilter())
        await queryClient.invalidateQueries(trpc.feed.pathFilter())
      },
    }),
  )

  const updateStarred = useMutation(
    trpc.article.updateStarred.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.article.pathFilter())
      },
    }),
  )

  const updateReadLater = useMutation(
    trpc.article.updateReadLater.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.article.pathFilter())
      },
    }),
  )

  return (
    <div className="border-border flex items-center justify-between border-b p-4">
      <div className="flex items-center gap-2">
        {/* Mark as Read/Unread */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => updateRead.mutate({ id: articleId, isRead: !isRead })}
          title={isRead ? "Mark as unread" : "Mark as read"}
          aria-label={isRead ? "Mark as unread" : "Mark as read"}
        >
          {isRead ? (
            <CheckCircle2Icon className="text-muted-foreground h-5 w-5" />
          ) : (
            <CircleIcon className="text-muted-foreground h-5 w-5" />
          )}
        </Button>

        {/* Star/Unstar */}
        <Button
          variant="ghost"
          size="icon"
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
          size="icon"
          onClick={() =>
            updateReadLater.mutate({
              id: articleId,
              isReadLater: !isReadLater,
            })
          }
          title={isReadLater ? "Remove from read later" : "Read later"}
          aria-label={isReadLater ? "Remove from read later" : "Read later"}
        >
          <ClockIcon
            className="text-primary h-5 w-5"
            fill={isReadLater ? "currentColor" : "none"}
          />
        </Button>
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
