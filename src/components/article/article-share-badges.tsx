"use client"

import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { EyeIcon, GlobeIcon, LockIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

dayjs.extend(relativeTime)

interface ArticleShareBadgesProps {
  isPubliclyShared: boolean
  hasPassword: boolean
  expiresAt: Date | null
  viewCount?: number
  className?: string
}

/**
 * Displays visual indicators for article sharing status
 *
 * Shows badges for public sharing, password protection, expiration date,
 * and view count. Only visible to article owners when viewing their own articles.
 */
export function ArticleShareBadges({
  isPubliclyShared,
  hasPassword,
  expiresAt,
  viewCount,
  className,
}: ArticleShareBadgesProps) {
  if (!isPubliclyShared) {
    return null
  }

  const now = new Date()
  const isExpired = expiresAt && expiresAt < now
  const expiresText = expiresAt
    ? isExpired
      ? "Expired"
      : `Expires ${dayjs(expiresAt).fromNow()}`
    : null

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Badge
        variant="outline"
        className="border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
      >
        <GlobeIcon className="mr-1.5 h-3.5 w-3.5" />
        Public
      </Badge>

      {hasPassword && (
        <Badge
          variant="outline"
          className="border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400"
        >
          <LockIcon className="mr-1.5 h-3.5 w-3.5" />
          Password Protected
        </Badge>
      )}

      {expiresText && (
        <Badge
          variant="outline"
          className={cn(
            isExpired
              ? "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400"
              : "border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-400",
          )}
        >
          {expiresText}
        </Badge>
      )}

      {typeof viewCount === "number" && viewCount > 0 && (
        <Badge
          variant="outline"
          className="border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-400"
        >
          <EyeIcon className="mr-1.5 h-3.5 w-3.5" />
          {viewCount} {viewCount === 1 ? "view" : "views"}
        </Badge>
      )}
    </div>
  )
}
