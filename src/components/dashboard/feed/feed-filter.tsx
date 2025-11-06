"use client"

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
    <div className="flex flex-col gap-1 p-2">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.value
        const count = counts?.[filter.value]

        return (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={cn(
              "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <span>{filter.label}</span>
            {count !== undefined && count > 0 && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
