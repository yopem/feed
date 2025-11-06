"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PlusIcon, RssIcon } from "lucide-react"

import { AddFeedDialog } from "@/components/dashboard/feed/add-feed-dialog"
import {
  FeedFilter,
  type FilterType,
} from "@/components/dashboard/feed/feed-filter"
import { FeedItem } from "@/components/dashboard/feed/feed-item"
import { EmptyState } from "@/components/dashboard/shared/empty-state"
import { LoadingSkeleton } from "@/components/dashboard/shared/loading-skeleton"
import { SurfaceCard } from "@/components/dashboard/shared/surface-card"
import { Button } from "@/components/ui/button"
import { useTRPC } from "@/lib/trpc/client"

interface FeedSidebarProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  selectedFeedId: string | null
  onFeedSelect: (feedId: string | null) => void
}

export function FeedSidebar({
  activeFilter,
  onFilterChange,
  selectedFeedId,
  onFeedSelect,
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
      <div className="flex flex-col gap-4 p-2">
        <SurfaceCard className="p-0">
          <div className="panel-header">
            <h2 className="text-foreground text-sm leading-5 font-medium">
              Filters
            </h2>
          </div>
          <div className="p-3">
            <FeedFilter
              activeFilter={activeFilter}
              onFilterChange={onFilterChange}
              counts={filterCounts}
            />
          </div>
        </SurfaceCard>

        <SurfaceCard className="flex flex-1 flex-col overflow-hidden">
          <div className="panel-header">
            <div className="flex items-center justify-between">
              <h2 className="text-foreground text-sm leading-5 font-medium">
                Feeds
              </h2>
              <Button
                size="xs"
                variant={selectedFeedId === null ? "secondary" : "ghost"}
                onClick={() => onFeedSelect(null)}
              >
                All
              </Button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            <Button
              size="xs"
              className="w-full"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Add Feed
            </Button>
            {feedsLoading ? (
              <LoadingSkeleton variant="list" count={5} />
            ) : !feedsWithStats || feedsWithStats.length === 0 ? (
              <EmptyState
                title="No feeds yet"
                description="Subscribe to some RSS feeds to get started"
                icon={<RssIcon className="h-12 w-12" />}
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
        </SurfaceCard>
      </div>

      <AddFeedDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
      />
    </>
  )
}
