"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { AddFeedDialog } from "@/components/dashboard/feed/add-feed-dialog"
import {
  FeedFilter,
  type FilterType,
} from "@/components/dashboard/feed/feed-filter"
import { FeedItem } from "@/components/dashboard/feed/feed-item"
import { EmptyState } from "@/components/dashboard/shared/empty-state"
import { GlassCard } from "@/components/dashboard/shared/glass-card"
import { LoadingSkeleton } from "@/components/dashboard/shared/loading-skeleton"
import { useTRPC } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"

interface FeedSidebarProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  selectedFeedId: string | null
  onFeedSelect: (feedId: string | null) => void
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export function FeedSidebar({
  activeFilter,
  onFilterChange,
  selectedFeedId,
  onFeedSelect,
  isMobileOpen = false,
  onMobileClose,
}: FeedSidebarProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const trpc = useTRPC()

  const { data: feeds, isLoading: feedsLoading } = useQuery(
    trpc.feed.all.queryOptions({
      page: 1,
      perPage: 100,
    }),
  )

  const { data: statistics } = useQuery(trpc.feed.statistics.queryOptions())

  const feedsWithStats = feeds?.map(
    (f: { id: string; title: string; imageUrl?: string | null }) => {
      const stats = statistics?.find(
        (s: { feedId: string }) => s.feedId === f.id,
      )
      return {
        ...f,
        unreadCount: stats?.unreadCount ?? 0,
        totalCount: stats?.totalCount ?? 0,
      }
    },
  )

  const filterCounts = {
    all:
      statistics?.reduce(
        (acc: number, s: { totalCount: number }) => acc + s.totalCount,
        0,
      ) ?? 0,
    unread:
      statistics?.reduce(
        (acc: number, s: { unreadCount: number }) => acc + s.unreadCount,
        0,
      ) ?? 0,
    starred:
      statistics?.reduce(
        (acc: number, s: { starredCount: number }) => acc + s.starredCount,
        0,
      ) ?? 0,
    readLater:
      statistics?.reduce(
        (acc: number, s: { readLaterCount: number }) => acc + s.readLaterCount,
        0,
      ) ?? 0,
  }

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 lg:relative lg:w-60",
          "flex flex-col gap-4 p-4",
          "transition-transform duration-300 lg:transform-none",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <GlassCard className="p-4">
          <h2 className="text-foreground mb-4 text-lg font-bold">Filters</h2>
          <FeedFilter
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
            counts={filterCounts}
          />
        </GlassCard>

        <GlassCard className="flex flex-1 flex-col overflow-hidden">
          <div className="border-border border-b p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-foreground text-lg font-bold">Feeds</h2>
              <button
                onClick={() => onFeedSelect(null)}
                className={cn(
                  "rounded-md px-2 py-1 text-xs transition-all",
                  selectedFeedId === null
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                All
              </button>
            </div>

            <button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors"
            >
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Feed
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-2">
            {feedsLoading ? (
              <LoadingSkeleton variant="list" count={5} />
            ) : !feedsWithStats || feedsWithStats.length === 0 ? (
              <EmptyState
                title="No feeds yet"
                description="Subscribe to some RSS feeds to get started"
                icon={
                  <svg
                    className="h-12 w-12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z"
                    />
                  </svg>
                }
              />
            ) : (
              feedsWithStats.map(
                (feed: {
                  id: string
                  title: string
                  imageUrl?: string | null
                  unreadCount: number
                }) => (
                  <FeedItem
                    key={feed.id}
                    id={feed.id}
                    title={feed.title}
                    imageUrl={feed.imageUrl}
                    unreadCount={feed.unreadCount}
                    isSelected={selectedFeedId === feed.id}
                    onSelect={onFeedSelect}
                  />
                ),
              )
            )}
          </div>
        </GlassCard>
      </aside>

      <AddFeedDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
      />
    </>
  )
}
