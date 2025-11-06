/* eslint-disable @next/next/no-img-element */

"use client"

import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

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
    <button
      onClick={() => onSelect(id)}
      className={cn(
        "w-full rounded-lg p-3 text-left transition-all",
        "hover:bg-accent",
        isSelected ? "bg-accent ring-ring ring-2" : "bg-card/30",
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
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </span>
            )}
            {isReadLater && (
              <span className="text-primary" title="Read Later">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
