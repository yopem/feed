/* eslint-disable @next/next/no-img-element */

"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { BookmarkIcon, CheckIcon, StarIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { useTRPC } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"
import { stripHtml } from "@/lib/utils/html"

dayjs.extend(relativeTime)

interface ArticleCardProps {
  id: string
  title: string
  slug: string
  description: string
  feedTitle: string
  feedSlug: string
  feedImageUrl?: string | null
  imageUrl?: string | null
  pubDate: Date
  isRead: boolean
  isStarred: boolean
  isReadLater: boolean
  isSelected: boolean
  onSelect: (id: string) => void
}

export function ArticleCard({
  id,
  title,
  slug: _slug, // Reserved for future navigation implementation
  description,
  feedTitle,
  feedSlug: _feedSlug, // Reserved for future navigation implementation
  feedImageUrl,
  imageUrl,
  pubDate,
  isRead,
  isStarred,
  isReadLater,
  isSelected,
  onSelect,
}: ArticleCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const updateReadStatus = useMutation(
    trpc.article.updateReadStatus.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.article.pathFilter())
        await queryClient.invalidateQueries(trpc.feed.pathFilter())
        toast.success(isRead ? "Marked as unread" : "Marked as read")
      },
      onError: () => {
        toast.error("Failed to update article")
      },
    }),
  )

  const updateStarred = useMutation(
    trpc.article.updateStarred.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.article.pathFilter())
        toast.success(isStarred ? "Removed from starred" : "Added to starred")
      },
      onError: () => {
        toast.error("Failed to update article")
      },
    }),
  )

  const updateReadLater = useMutation(
    trpc.article.updateReadLater.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.article.pathFilter())
        toast.success(
          isReadLater ? "Removed from read later" : "Added to read later",
        )
      },
      onError: () => {
        toast.error("Failed to update article")
      },
    }),
  )

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation()
    action()
  }

  return (
    <Card
      className={cn(
        "cursor-pointer gap-0 transition-all hover:shadow-md",
        isSelected && "ring-ring bg-accent ring-2",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(id)}
    >
      <CardHeader className="space-y-0 pb-2">
        <div className="flex items-center gap-2">
          {feedImageUrl && (
            <img
              src={feedImageUrl}
              alt={feedTitle}
              className="h-4 w-4 rounded"
            />
          )}
          <span className="text-muted-foreground truncate text-xs">
            {feedTitle}
          </span>
          <span className="text-muted-foreground/60 text-xs">•</span>
          <span className="text-muted-foreground text-xs">
            {dayjs(pubDate).fromNow()}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        <div className="flex gap-3">
          {imageUrl && (
            <div className="bg-muted h-16 w-20 shrink-0 overflow-hidden rounded-md">
              <img
                src={imageUrl}
                alt={title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-1">
            <h3
              className={cn(
                "line-clamp-2 text-sm leading-snug font-semibold tracking-tight",
                isRead ? "text-foreground/60" : "text-foreground",
              )}
            >
              {title}
            </h3>

            <p
              className={cn(
                "line-clamp-2 text-xs leading-relaxed",
                isRead ? "text-muted-foreground/70" : "text-muted-foreground",
              )}
            >
              {stripHtml(description)}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter
        className={cn(
          "justify-between pt-0 pb-3 transition-all",
          isHovered ? "flex" : "hidden",
        )}
      >
        <div className="flex items-center gap-2">
          {isStarred && (
            <span className="text-primary" title="Starred">
              <StarIcon className="h-3.5 w-3.5 fill-current" />
            </span>
          )}
          {isReadLater && (
            <span className="text-primary" title="Read Later">
              <BookmarkIcon className="h-3.5 w-3.5 fill-current" />
            </span>
          )}
        </div>

        {/* Hover Actions */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={isReadLater ? "default" : "outline"}
            className="h-7 gap-1 px-2"
            onClick={(e) =>
              handleActionClick(e, () =>
                updateReadLater.mutate({ id, isReadLater: !isReadLater }),
              )
            }
            title={isReadLater ? "Remove from read later" : "Read later"}
          >
            <BookmarkIcon className="h-3 w-3" />
          </Button>

          <Button
            size="sm"
            variant={isStarred ? "default" : "outline"}
            className="h-7 gap-1 px-2"
            onClick={(e) =>
              handleActionClick(e, () =>
                updateStarred.mutate({ id, isStarred: !isStarred }),
              )
            }
            title={isStarred ? "Remove from starred" : "Star"}
          >
            <StarIcon className="h-3 w-3" />
          </Button>

          <Button
            size="sm"
            variant={isRead ? "outline" : "default"}
            className="h-7 gap-1 px-2"
            onClick={(e) =>
              handleActionClick(e, () =>
                updateReadStatus.mutate({ id, isRead: !isRead }),
              )
            }
            title={isRead ? "Mark as unread" : "Mark as read"}
          >
            <CheckIcon className="h-3 w-3" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
