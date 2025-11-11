"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type FilterType = "all" | "unread" | "starred" | "readLater"

interface FeedFilterProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  counts?: {
    all: number
    unread: number
    starred: number
    readLater: number
  }
}

const filters: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "starred", label: "Starred" },
  { value: "readLater", label: "Read Later" },
]

export function FeedFilter({
  activeFilter,
  onFilterChange,
  counts,
}: FeedFilterProps) {
  return (
    <div className="flex flex-col gap-1">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.value
        const count = counts?.[filter.value]

        return (
          <Button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            variant={isActive ? "default" : "ghost"}
            className={cn(
              "justify-between",
              !isActive && "text-muted-foreground",
            )}
          >
            <span>{filter.label}</span>
            {count !== undefined && count > 0 && (
              <Badge variant={isActive ? "secondary" : "outline"}>
                {count}
              </Badge>
            )}
          </Button>
        )
      })}
    </div>
  )
}
