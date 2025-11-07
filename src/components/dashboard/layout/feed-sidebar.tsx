"use client"

import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { PlusIcon, RssIcon, TagIcon } from "lucide-react"
import { toast } from "sonner"

import { AddFeedDialog } from "@/components/dashboard/feed/add-feed-dialog"
import { DeleteFeedDialog } from "@/components/dashboard/feed/delete-feed-dialog"
import { EditFeedDialog } from "@/components/dashboard/feed/edit-feed-dialog"
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

interface FeedWithTags {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  userId: string
  createdAt: Date | null
  updatedAt: Date | null
  url: string
  lastUpdated: Date | null
  tags?: {
    tag: {
      id: string
      name: string
    }
  }[]
}

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
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [editingFeed, setEditingFeed] = useState<{
    id: string
    title: string
    description?: string
    tagIds?: string[]
  } | null>(null)
  const [deletingFeed, setDeletingFeed] = useState<{
    id: string
    title: string
  } | null>(null)
  const [refreshingFeedId, setRefreshingFeedId] = useState<string | null>(null)
  const trpc = useTRPC()

  const { data: feeds, isLoading: feedsLoading } = useQuery(
    trpc.feed.all.queryOptions({
      page: 1,
      perPage: 100,
    }),
  )

  const refreshMutation = useMutation(trpc.feed.refresh.mutationOptions())

  const handleRefreshFeed = async (feedId: string) => {
    setRefreshingFeedId(feedId)
    try {
      const result = await refreshMutation.mutateAsync(feedId)
      if (result && result.newArticles === 0) {
        toast.success("Feed is up to date")
      } else if (result) {
        toast.success(
          `Added ${result.newArticles} new article${result.newArticles > 1 ? "s" : ""}`,
        )
      }
    } catch (error) {
      toast.error("Failed to refresh feed", {
        description:
          error instanceof Error ? error.message : "Please try again",
      })
    } finally {
      setRefreshingFeedId(null)
    }
  }

  const { data: statistics } = useQuery(trpc.feed.statistics.queryOptions())

  const { data: tags } = useQuery(trpc.tag.all.queryOptions())

  // Filter feeds by selected tag
  const filteredFeeds = selectedTagId
    ? (feeds as FeedWithTags[] | undefined)?.filter((feed) =>
        feed.tags?.some((t) => t.tag.id === selectedTagId),
      )
    : feeds

  const feedsWithStats = (filteredFeeds as FeedWithTags[] | undefined)?.map(
    (f) => {
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

        {tags && tags.length > 0 && (
          <SurfaceCard className="p-0">
            <div className="panel-header">
              <h2 className="text-foreground text-sm leading-5 font-medium">
                Tags
              </h2>
            </div>
            <div className="flex cursor-pointer flex-wrap gap-2 p-3">
              <Button
                size="xs"
                variant={selectedTagId === null ? "secondary" : "outline"}
                onClick={() => setSelectedTagId(null)}
              >
                All Tags
              </Button>
              {tags.map((tag) => (
                <Button
                  key={tag.id}
                  size="xs"
                  variant={selectedTagId === tag.id ? "secondary" : "outline"}
                  onClick={() => setSelectedTagId(tag.id)}
                >
                  <TagIcon className="mr-1 h-3 w-3" />
                  {tag.name}
                </Button>
              ))}
            </div>
          </SurfaceCard>
        )}

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
              feedsWithStats.map((feed) => (
                <FeedItem
                  key={feed.id}
                  id={feed.id}
                  title={feed.title}
                  imageUrl={feed.imageUrl}
                  unreadCount={feed.unreadCount}
                  isSelected={selectedFeedId === feed.id}
                  onSelect={onFeedSelect}
                  tags={feed.tags?.map((t) => t.tag) ?? []}
                  onRefresh={handleRefreshFeed}
                  isRefreshing={refreshingFeedId === feed.id}
                  onEdit={(id) => {
                    const feedToEdit = (
                      feeds as FeedWithTags[] | undefined
                    )?.find((f) => f.id === id)
                    if (feedToEdit) {
                      // Extract tag IDs from the feed
                      const tagIds = feedToEdit.tags?.map((t) => t.tag.id) ?? []

                      setEditingFeed({
                        id: feedToEdit.id,
                        title: feedToEdit.title,
                        description: feedToEdit.description ?? undefined,
                        tagIds,
                      })
                    }
                  }}
                  onDelete={(id) => {
                    const feedToDelete = feedsWithStats.find((f) => f.id === id)
                    if (feedToDelete) {
                      setDeletingFeed({
                        id: feedToDelete.id,
                        title: feedToDelete.title,
                      })
                    }
                  }}
                />
              ))
            )}
          </div>
        </SurfaceCard>
      </div>

      <AddFeedDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
      />

      {editingFeed && (
        <EditFeedDialog
          isOpen={true}
          onClose={() => setEditingFeed(null)}
          feedId={editingFeed.id}
          initialTitle={editingFeed.title}
          initialDescription={editingFeed.description}
          initialTagIds={editingFeed.tagIds}
        />
      )}

      {deletingFeed && (
        <DeleteFeedDialog
          isOpen={true}
          onClose={() => setDeletingFeed(null)}
          feedId={deletingFeed.id}
          feedTitle={deletingFeed.title}
        />
      )}
    </>
  )
}
