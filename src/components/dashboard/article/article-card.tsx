/* eslint-disable @next/next/no-img-element */

"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { BookmarkIcon, CheckIcon, StarIcon } from "lucide-react"
import { toast } from "sonner"

import { SurfaceCard } from "@/components/dashboard/shared/surface-card"
import { Button } from "@/components/ui/button"
import { useTRPC } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"
import { stripHtml } from "@/lib/utils/html"

dayjs.extend(relativeTime)

interface ArticleCardProps {
  id: string
  title: string
  description: string
  feedTitle: string
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
  description,
  feedTitle,
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
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SurfaceCard
        hover
        onClick={() => onSelect(id)}
        className={cn(
          "w-full p-3 text-left",
          isSelected && "bg-accent ring-ring ring-2",
          !isRead && "border-primary border-l-4",
        )}
      >
        <div className="flex gap-3">
          {imageUrl && (
            <div className="bg-muted h-20 w-20 shrink-0 overflow-hidden rounded-lg">
              <img
                src={imageUrl}
                alt={title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
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

            <h3
              className={cn(
                "mb-1 line-clamp-2 text-sm font-semibold tracking-tight",
                isRead ? "text-muted-foreground" : "text-foreground",
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

            <div className="mt-2 flex items-center gap-2">
              {isStarred && (
                <span className="text-primary" title="Starred">
                  <StarIcon className="h-4 w-4" />
                </span>
              )}
              {isReadLater && (
                <span className="text-primary" title="Read Later">
                  <BookmarkIcon className="h-4 w-4" />
                </span>
              )}
            </div>
          </div>
        </div>
      </SurfaceCard>

      {/* Hover Actions */}
      {isHovered && (
        <div className="absolute right-3 bottom-3 z-10 flex gap-1">
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
      )}
    </div>
  )
}
