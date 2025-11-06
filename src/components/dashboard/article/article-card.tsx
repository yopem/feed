/* eslint-disable @next/next/no-img-element */

"use client"

import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { ClockIcon, StarIcon } from "lucide-react"

import { SurfaceCard } from "@/components/dashboard/shared/surface-card"
import { cn } from "@/lib/utils"

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
  return (
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
              "mb-1 line-clamp-2 text-sm font-semibold",
              isRead ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {title}
          </h3>

          <p
            className={cn(
              "line-clamp-2 text-xs",
              isRead ? "text-muted-foreground/70" : "text-muted-foreground",
            )}
          >
            {description}
          </p>

          <div className="mt-2 flex items-center gap-2">
            {isStarred && (
              <span className="text-primary" title="Starred">
                <StarIcon className="h-4 w-4" />
              </span>
            )}
            {isReadLater && (
              <span className="text-primary" title="Read Later">
                <ClockIcon className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      </div>
    </SurfaceCard>
  )
}
