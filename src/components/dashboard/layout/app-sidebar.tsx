"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  BookmarkIcon,
  InboxIcon,
  ListIcon,
  PlusIcon,
  RssIcon,
  StarIcon,
  TagIcon,
} from "lucide-react"

import { AddFeedDialog } from "@/components/dashboard/feed/add-feed-dialog"
import { DeleteFeedDialog } from "@/components/dashboard/feed/delete-feed-dialog"
import { EditFeedDialog } from "@/components/dashboard/feed/edit-feed-dialog"
import type { FilterType } from "@/components/dashboard/feed/feed-filter"
import { EmptyState } from "@/components/dashboard/shared/empty-state"
import { LoadingSkeleton } from "@/components/dashboard/shared/loading-skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useTRPC } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"

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

interface AppSidebarProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  selectedFeedId: string | null
  onFeedSelect: (feedId: string | null) => void
}

const filterItems = [
  { value: "all" as const, label: "All Articles", icon: ListIcon },
  { value: "unread" as const, label: "Unread", icon: InboxIcon },
  { value: "starred" as const, label: "Starred", icon: StarIcon },
  { value: "readLater" as const, label: "Read Later", icon: BookmarkIcon },
]

export function AppSidebar({
  activeFilter,
  onFilterChange,
  selectedFeedId,
  onFeedSelect,
}: AppSidebarProps) {
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
  const trpc = useTRPC()

  const { data: feeds, isLoading: feedsLoading } = useQuery(
    trpc.feed.all.queryOptions({
      page: 1,
      perPage: 100,
    }),
  )

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
      <Sidebar collapsible="offcanvas">
        <SidebarContent>
          {/* Filters Section */}
          <SidebarGroup>
            <SidebarGroupLabel>Filters</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filterItems.map((filter) => {
                  const isActive = activeFilter === filter.value
                  const count = filterCounts[filter.value]
                  const Icon = filter.icon

                  return (
                    <SidebarMenuItem key={filter.value}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => onFilterChange(filter.value)}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{filter.label}</span>
                        {count > 0 && (
                          <Badge
                            variant={isActive ? "secondary" : "outline"}
                            className="ml-auto"
                          >
                            {count}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Tags Section */}
          {tags && tags.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>Tags</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="flex flex-wrap gap-1.5 px-2">
                  <Button
                    size="xs"
                    variant={selectedTagId === null ? "secondary" : "outline"}
                    onClick={() => setSelectedTagId(null)}
                  >
                    All
                  </Button>
                  {tags.map((tag) => (
                    <Button
                      key={tag.id}
                      size="xs"
                      variant={
                        selectedTagId === tag.id ? "secondary" : "outline"
                      }
                      onClick={() => setSelectedTagId(tag.id)}
                    >
                      <TagIcon className="mr-1 h-3 w-3" />
                      {tag.name}
                    </Button>
                  ))}
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Feeds Section */}
          <SidebarGroup className="flex-1">
            <SidebarGroupLabel>
              <span>Feeds</span>
              <Button
                size="xs"
                variant={selectedFeedId === null ? "secondary" : "ghost"}
                onClick={() => onFeedSelect(null)}
                className="ml-auto"
              >
                All
              </Button>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setIsAddDialogOpen(true)}
                    className="w-full"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Add Feed</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {feedsLoading ? (
                  <div className="px-2">
                    <LoadingSkeleton variant="list" count={5} />
                  </div>
                ) : !feedsWithStats || feedsWithStats.length === 0 ? (
                  <div className="px-2 py-4">
                    <EmptyState
                      title="No feeds yet"
                      description="Subscribe to some RSS feeds to get started"
                      icon={<RssIcon className="h-12 w-12" />}
                    />
                  </div>
                ) : (
                  feedsWithStats.map((feed) => {
                    const isSelected = selectedFeedId === feed.id

                    return (
                      <SidebarMenuItem key={feed.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={isSelected}
                          onClick={() => onFeedSelect(feed.id)}
                          className={cn(
                            "group h-auto cursor-pointer py-2",
                            isSelected && "bg-accent",
                          )}
                        >
                          <div>
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage src={feed.imageUrl ?? undefined} />
                              <AvatarFallback className="text-xs">
                                {feed.title.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                              <span className="truncate text-sm font-medium">
                                {feed.title}
                              </span>
                              {feed.tags && feed.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {feed.tags.map((t) => (
                                    <Badge
                                      key={t.tag.id}
                                      variant="outline"
                                      className="h-4 px-1 text-[10px]"
                                    >
                                      {t.tag.name}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            {feed.unreadCount > 0 && (
                              <Badge className="ml-auto shrink-0">
                                {feed.unreadCount}
                              </Badge>
                            )}
                            <div className="ml-2 hidden shrink-0 gap-1 group-hover:flex">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const feedToEdit = (
                                    feeds as FeedWithTags[] | undefined
                                  )?.find((f) => f.id === feed.id)
                                  if (feedToEdit) {
                                    const tagIds =
                                      feedToEdit.tags?.map((t) => t.tag.id) ??
                                      []
                                    setEditingFeed({
                                      id: feedToEdit.id,
                                      title: feedToEdit.title,
                                      description:
                                        feedToEdit.description ?? undefined,
                                      tagIds,
                                    })
                                  }
                                }}
                                className="hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:ring-1 focus-visible:outline-none"
                              >
                                <span className="sr-only">Edit</span>
                                <svg
                                  className="h-3.5 w-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeletingFeed({
                                    id: feed.id,
                                    title: feed.title,
                                  })
                                }}
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:ring-ring inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:ring-1 focus-visible:outline-none"
                              >
                                <span className="sr-only">Delete</span>
                                <svg
                                  className="h-3.5 w-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

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
