"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  BookmarkIcon,
  InboxIcon,
  ListIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  RssIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react"
import { parseAsString, useQueryState } from "nuqs"

import { AddFeedDialog } from "@/components/feed/add-feed-dialog"
import { AddTagDialog } from "@/components/feed/add-tag-dialog"
import { DeleteFeedDialog } from "@/components/feed/delete-feed-dialog"
import { DeleteTagDialog } from "@/components/feed/delete-tag-dialog"
import { EditFeedDialog } from "@/components/feed/edit-feed-dialog"
import { EditTagDialog } from "@/components/feed/edit-tag-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingSkeleton } from "@/components/shared/loading-skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  slug: string
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

const filterItems = [
  { value: "all" as const, label: "All Articles", icon: ListIcon },
  { value: "unread" as const, label: "Unread", icon: InboxIcon },
  { value: "starred" as const, label: "Starred", icon: StarIcon },
  { value: "readLater" as const, label: "Read Later", icon: BookmarkIcon },
]

export function AppSidebar() {
  const [feedSlug, setFeedSlug] = useQueryState(
    "feed",
    parseAsString.withDefault(""),
  )
  const [filter, setFilter] = useQueryState(
    "filter",
    parseAsString.withDefault("all"),
  )
  const [tagSlug, setTagSlug] = useQueryState("tag", parseAsString)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAddTagDialogOpen, setIsAddTagDialogOpen] = useState(false)
  const [hoveredTagId, setHoveredTagId] = useState<string | null>(null)
  const [hoveredFeedId, setHoveredFeedId] = useState<string | null>(null)
  const [isFeedsHeaderHovered, setIsFeedsHeaderHovered] = useState(false)
  const [isTagsHeaderHovered, setIsTagsHeaderHovered] = useState(false)
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
  const [editingTag, setEditingTag] = useState<{
    id: string
    name: string
    description?: string
  } | null>(null)
  const [deletingTag, setDeletingTag] = useState<{
    id: string
    name: string
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

  const selectedTag = tagSlug
    ? tags?.find((t) => t.id === tagSlug || t.name === tagSlug)
    : null

  const filteredFeeds = selectedTag
    ? (feeds as FeedWithTags[] | undefined)?.filter((feed) =>
        feed.tags?.some((t) => t.tag.id === selectedTag.id),
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
          <SidebarGroup>
            <SidebarGroupContent className="px-2 pt-2">
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="w-full"
                size="sm"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Feed</span>
              </Button>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Filters</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filterItems.map((filterItem) => {
                  const isActive = filter === filterItem.value
                  const count = filterCounts[filterItem.value]
                  const Icon = filterItem.icon

                  return (
                    <SidebarMenuItem key={filterItem.value}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        onClick={() => setFilter(filterItem.value)}
                        className={cn(
                          "group cursor-pointer",
                          isActive && "bg-accent",
                        )}
                      >
                        <div>
                          <Icon className="h-4 w-4" />
                          <span className="truncate text-sm font-medium">
                            {filterItem.label}
                          </span>
                          {count > 0 && (
                            <Badge
                              variant={isActive ? "secondary" : "outline"}
                              className="ml-auto"
                            >
                              {count}
                            </Badge>
                          )}
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {tags && tags.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel
                onMouseEnter={() => setIsTagsHeaderHovered(true)}
                onMouseLeave={() => setIsTagsHeaderHovered(false)}
              >
                <span>Tags</span>
                {isTagsHeaderHovered && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setIsAddTagDialogOpen(true)}
                    className="ml-auto"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Add</span>
                  </Button>
                )}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem
                    onMouseEnter={() => setHoveredTagId("all")}
                    onMouseLeave={() => setHoveredTagId(null)}
                  >
                    <SidebarMenuButton
                      asChild
                      isActive={!selectedTag}
                      onClick={() => setTagSlug(null)}
                      className={cn(
                        "group cursor-pointer",
                        !selectedTag && "bg-accent",
                      )}
                    >
                      <div>
                        <span className="cursor-pointer truncate text-sm font-medium">
                          All
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {tags.map((tag) => {
                    const isSelected = selectedTag?.id === tag.id
                    const isHovered = hoveredTagId === tag.id

                    return (
                      <SidebarMenuItem
                        key={tag.id}
                        onMouseEnter={() => setHoveredTagId(tag.id)}
                        onMouseLeave={() => setHoveredTagId(null)}
                      >
                        <SidebarMenuButton
                          asChild
                          isActive={isSelected}
                          onClick={() => setTagSlug(tag.id)}
                          className={cn(
                            "group cursor-pointer",
                            isSelected && "bg-accent",
                          )}
                        >
                          <div>
                            <span className="truncate text-sm font-medium">
                              {tag.name}
                            </span>
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                  }}
                                  className={cn(
                                    "hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring ml-auto h-6 w-6 shrink-0 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:ring-1 focus-visible:outline-none",
                                    isHovered ? "inline-flex" : "hidden",
                                  )}
                                >
                                  <span className="sr-only">More options</span>
                                  <MoreHorizontalIcon className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                side="bottom"
                                sideOffset={4}
                              >
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingTag({
                                      id: tag.id,
                                      name: tag.name,
                                      description: tag.description ?? undefined,
                                    })
                                  }}
                                >
                                  <PencilIcon className="h-4 w-4" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setDeletingTag({
                                      id: tag.id,
                                      name: tag.name,
                                    })
                                  }}
                                >
                                  <Trash2Icon className="h-4 w-4" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          <SidebarGroup className="flex-1">
            <SidebarGroupLabel
              onMouseEnter={() => setIsFeedsHeaderHovered(true)}
              onMouseLeave={() => setIsFeedsHeaderHovered(false)}
            >
              <span>Feeds</span>
              {isFeedsHeaderHovered && (
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => setIsAddDialogOpen(true)}
                  className="ml-auto"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Add</span>
                </Button>
              )}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setFeedSlug("")}
                    className="w-full cursor-pointer"
                    isActive={feedSlug === ""}
                  >
                    <span>All</span>
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
                    const isSelected = feedSlug === feed.slug
                    const isHovered = hoveredFeedId === feed.id

                    return (
                      <SidebarMenuItem
                        key={feed.id}
                        onMouseEnter={() => setHoveredFeedId(feed.id)}
                        onMouseLeave={() => setHoveredFeedId(null)}
                      >
                        <SidebarMenuButton
                          asChild
                          isActive={isSelected}
                          onClick={() => setFeedSlug(feed.slug)}
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
                            </div>
                            {feed.unreadCount > 0 && (
                              <Badge
                                variant={isSelected ? "secondary" : "outline"}
                                className="ml-auto shrink-0"
                              >
                                {feed.unreadCount}
                              </Badge>
                            )}
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                  }}
                                  className={cn(
                                    "hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring ml-2 h-6 w-6 shrink-0 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:ring-1 focus-visible:outline-none",
                                    isHovered ? "inline-flex" : "hidden",
                                  )}
                                >
                                  <span className="sr-only">More options</span>
                                  <MoreHorizontalIcon className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                side="bottom"
                                sideOffset={4}
                              >
                                <DropdownMenuItem
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
                                >
                                  <PencilIcon className="h-4 w-4" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setDeletingFeed({
                                      id: feed.id,
                                      title: feed.title,
                                    })
                                  }}
                                >
                                  <Trash2Icon className="h-4 w-4" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

      <AddTagDialog
        isOpen={isAddTagDialogOpen}
        onClose={() => setIsAddTagDialogOpen(false)}
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

      {editingTag && (
        <EditTagDialog
          isOpen={true}
          onClose={() => setEditingTag(null)}
          tagId={editingTag.id}
          initialName={editingTag.name}
          initialDescription={editingTag.description}
        />
      )}

      {deletingTag && (
        <DeleteTagDialog
          isOpen={true}
          onClose={() => setDeletingTag(null)}
          tagId={deletingTag.id}
          tagName={deletingTag.name}
        />
      )}
    </>
  )
}
