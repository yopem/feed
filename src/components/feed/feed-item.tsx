"use client"

import Image from "next/image"
import { EditIcon, RefreshCwIcon, TrashIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface FeedItemProps {
  id: string
  title: string
  imageUrl?: string | null
  unreadCount: number
  isSelected: boolean
  onSelect: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onRefresh?: (id: string) => void
  isRefreshing?: boolean
  tags?: { id: string; name: string }[]
}

export function FeedItem({
  id,
  title,
  imageUrl,
  unreadCount,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onRefresh,
  isRefreshing = false,
  tags = [],
}: FeedItemProps) {
  return (
    <Card
      onClick={() => onSelect(id)}
      className={cn(
        "group cursor-pointer p-3 transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_hsl(var(--foreground))] active:translate-x-1 active:translate-y-1 active:shadow-none motion-reduce:transition-none motion-reduce:hover:transform-none",
        isSelected && "bg-accent ring-ring ring-2",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="bg-muted relative h-10 w-10 shrink-0 overflow-hidden rounded-md">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center text-xs font-semibold">
              {title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-foreground truncate text-sm font-semibold">
            {title}
          </h4>
          {tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="h-5 px-1.5 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
        {unreadCount > 0 && <Badge className="shrink-0">{unreadCount}</Badge>}

        <div className="flex shrink-0 gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
          {onRefresh && (
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onRefresh(id)
              }}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Refresh feed"
              disabled={isRefreshing}
            >
              <RefreshCwIcon
                className={cn("h-4 w-4", isRefreshing && "animate-spin")}
              />
            </Button>
          )}
          {onEdit && (
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(id)
              }}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Edit feed"
            >
              <EditIcon className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(id)
              }}
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
              aria-label="Delete feed"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
