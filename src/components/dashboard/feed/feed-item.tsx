"use client"

import Image from "next/image"

import { GlassCard } from "@/components/dashboard/shared/glass-card"
import { cn } from "@/lib/utils"

interface FeedItemProps {
  id: string
  title: string
  imageUrl?: string | null
  unreadCount: number
  isSelected: boolean
  onSelect: (id: string) => void
}

export function FeedItem({
  id,
  title,
  imageUrl,
  unreadCount,
  isSelected,
  onSelect,
}: FeedItemProps) {
  return (
    <GlassCard
      hover
      onClick={() => onSelect(id)}
      className={cn(
        "p-3 transition-all",
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
        </div>
        {unreadCount > 0 && (
          <span className="bg-primary text-primary-foreground shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold">
            {unreadCount}
          </span>
        )}
      </div>
    </GlassCard>
  )
}
