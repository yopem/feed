"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  BookmarkIcon,
  CalendarIcon,
  ChevronUpIcon,
  InboxIcon,
  ListIcon,
  LogOutIcon,
  MoonIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  RssIcon,
  SettingsIcon,
  ShareIcon,
  StarIcon,
  SunIcon,
  Trash2Icon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { parseAsString, useQueryState } from "nuqs"
import { toast } from "sonner"

import { AddFeedDialog } from "@/components/feed/add-feed-dialog"
import { AddTagDialog } from "@/components/feed/add-tag-dialog"
import { BulkShareDialog } from "@/components/feed/bulk-share-dialog"
import { DeleteFeedDialog } from "@/components/feed/delete-feed-dialog"
import { DeleteTagDialog } from "@/components/feed/delete-tag-dialog"
import { EditFeedDialog } from "@/components/feed/edit-feed-dialog"
import { EditTagDialog } from "@/components/feed/edit-tag-dialog"
import Link from "@/components/link"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingSkeleton } from "@/components/shared/loading-skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { logout } from "@/lib/auth/logout"
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
  isBulkShared: boolean
  isFavorited: boolean
  tags?: {
    tag: {
      id: string
      name: string
    }
  }[]
}

const filterItems = [
  { value: "today" as const, label: "Today", icon: CalendarIcon },
  { value: "all" as const, label: "All Articles", icon: ListIcon },
  { value: "unread" as const, label: "Unread", icon: InboxIcon },
  { value: "starred" as const, label: "Favorited", icon: StarIcon },
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
  const [bulkSharingFeed, setBulkSharingFeed] = useState<{
    id: string
    title: string
    articleCount: number
    isBulkShared: boolean
  } | null>(null)
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { setOpenMobile, isMobile } = useSidebar()

  const { data: feeds, isLoading: feedsLoading } = useQuery(
    trpc.feed.all.queryOptions({
      page: 1,
      perPage: 100,
    }),
  )

  const { data: statistics } = useQuery(trpc.feed.statistics.queryOptions())

  const { data: tags } = useQuery(trpc.tag.all.queryOptions())

  const { data: user, isLoading: userLoading } = useQuery(
    trpc.user.getCurrentUser.queryOptions(),
  )

  const { theme, setTheme } = useTheme()

  const refreshAll = useMutation(
    trpc.feed.refreshAll.mutationOptions({
      onSuccess: async (data) => {
        if (data) {
          await queryClient.invalidateQueries(trpc.feed.pathFilter())
          await queryClient.invalidateQueries(trpc.article.pathFilter())
          toast.success(
            `Refreshed ${data.refreshedFeeds} of ${data.totalFeeds} feed${data.totalFeeds !== 1 ? "s" : ""} successfully${
              data.failedFeeds > 0 ? `. ${data.failedFeeds} failed.` : ""
            }`,
          )
        }
      },
      onError: (err: { message: string }) => {
        toast.error(err.message || "Failed to refresh feeds")
      },
    }),
  )

  const toggleFeedFavorited = useMutation(
    trpc.feed.toggleFavorited.mutationOptions({
      onSuccess: async (data) => {
        if (data) {
          await queryClient.invalidateQueries(trpc.feed.pathFilter())
          toast.success(
            data.isFavorited
              ? "Feed added to favorites"
              : "Feed removed from favorites",
          )
        }
      },
      onError: (err: { message: string }) => {
        toast.error(err.message || "Failed to update feed")
      },
    }),
  )

  const toggleTagFavorited = useMutation(
    trpc.tag.toggleFavorited.mutationOptions({
      onSuccess: async (data) => {
        if (data) {
          await queryClient.invalidateQueries(trpc.tag.pathFilter())
          toast.success(
            data.isFavorited
              ? "Tag added to favorites"
              : "Tag removed from favorites",
          )
        }
      },
      onError: (err: { message: string }) => {
        toast.error(err.message || "Failed to update tag")
      },
    }),
  )

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
    today:
      statistics?.reduce(
        (acc: number, s: { todayCount?: number }) => acc + (s.todayCount ?? 0),
        0,
      ) ?? 0,
    unread:
      statistics?.reduce(
        (acc: number, s: { unreadCount: number }) => acc + s.unreadCount,
        0,
      ) ?? 0,
    starred:
      (statistics as { favoritedCount: number }[] | undefined)?.reduce(
        (acc: number, s) => acc + s.favoritedCount,
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
              <Button
                onClick={() => refreshAll.mutate()}
                className="mt-2 w-full"
                size="sm"
                variant="secondary"
                disabled={refreshAll.isPending}
              >
                <RefreshCwIcon
                  className={cn(
                    "h-4 w-4",
                    refreshAll.isPending && "animate-spin",
                  )}
                />
                <span>
                  {refreshAll.isPending ? "Refreshing..." : "Refresh All Feeds"}
                </span>
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
                        onClick={() => {
                          void setFilter(filterItem.value)
                          if (isMobile) setOpenMobile(false)
                        }}
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

          {(feeds?.some((f) => f.isFavorited) ??
            tags?.some((t) => t.isFavorited)) && (
            <SidebarGroup>
              <SidebarGroupLabel>Favorites</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {feeds
                    ?.filter((feed) => feed.isFavorited)
                    .map((feed) => {
                      const isSelected = feedSlug === feed.slug
                      return (
                        <SidebarMenuItem key={`fav-feed-${feed.id}`}>
                          <SidebarMenuButton
                            asChild
                            isActive={isSelected}
                            onClick={() => {
                              void setFeedSlug(feed.slug)
                              void setTagSlug(null)
                              if (isMobile) setOpenMobile(false)
                            }}
                            className={cn(
                              "group cursor-pointer",
                              isSelected && "bg-accent",
                            )}
                          >
                            <div>
                              <Avatar className="h-6 w-6 shrink-0">
                                <AvatarImage src={feed.imageUrl ?? undefined} />
                                <AvatarFallback className="text-xs">
                                  {feed.title.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate text-sm font-medium">
                                {feed.title}
                              </span>
                              <StarIcon className="ml-auto h-3.5 w-3.5 shrink-0 fill-current text-yellow-500" />
                            </div>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  {tags
                    ?.filter((tag) => tag.isFavorited)
                    .map((tag) => {
                      const isSelected = tagSlug === tag.id
                      return (
                        <SidebarMenuItem key={`fav-tag-${tag.id}`}>
                          <SidebarMenuButton
                            asChild
                            isActive={isSelected}
                            onClick={() => {
                              void setTagSlug(tag.id)
                              void setFeedSlug("")
                              if (isMobile) setOpenMobile(false)
                            }}
                            className={cn(
                              "group cursor-pointer",
                              isSelected && "bg-accent",
                            )}
                          >
                            <div>
                              <span className="truncate text-sm font-medium">
                                {tag.name}
                              </span>
                              <StarIcon className="ml-auto h-3.5 w-3.5 shrink-0 fill-current text-yellow-500" />
                            </div>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

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
                      onClick={() => {
                        void setTagSlug(null)
                        if (isMobile) setOpenMobile(false)
                      }}
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
                          onClick={() => {
                            void setTagSlug(tag.id)
                            if (isMobile) setOpenMobile(false)
                          }}
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
                                  type="button"
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
                                className="w-48"
                                sideOffset={8}
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
                                  className="cursor-pointer py-2.5"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                  <span>Edit tag</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleTagFavorited.mutate({
                                      id: tag.id,
                                      isFavorited: !tag.isFavorited,
                                    })
                                  }}
                                  className="cursor-pointer py-2.5"
                                >
                                  <StarIcon
                                    className={cn(
                                      "h-4 w-4",
                                      tag.isFavorited && "fill-current",
                                    )}
                                  />
                                  <span>
                                    {tag.isFavorited
                                      ? "Remove from Favorites"
                                      : "Add to Favorites"}
                                  </span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setDeletingTag({
                                      id: tag.id,
                                      name: tag.name,
                                    })
                                  }}
                                  className="cursor-pointer py-2.5"
                                >
                                  <Trash2Icon className="h-4 w-4" />
                                  <span>Delete tag</span>
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
                    onClick={() => {
                      void setFeedSlug("")
                      if (isMobile) setOpenMobile(false)
                    }}
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
                          onClick={() => {
                            void setFeedSlug(feed.slug)
                            if (isMobile) setOpenMobile(false)
                          }}
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
                                  type="button"
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
                                className="w-48"
                                sideOffset={8}
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
                                  className="cursor-pointer py-2.5"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                  <span>Edit feed</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleFeedFavorited.mutate({
                                      id: feed.id,
                                      isFavorited: !feed.isFavorited,
                                    })
                                  }}
                                  className="cursor-pointer py-2.5"
                                >
                                  <StarIcon
                                    className={cn(
                                      "h-4 w-4",
                                      feed.isFavorited && "fill-current",
                                    )}
                                  />
                                  <span>
                                    {feed.isFavorited
                                      ? "Add to Favorites"
                                      : "Remove from Favorites"}
                                  </span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const stats = statistics?.find(
                                      (s: { feedId: string }) =>
                                        s.feedId === feed.id,
                                    )
                                    setBulkSharingFeed({
                                      id: feed.id,
                                      title: feed.title,
                                      articleCount: stats?.totalCount ?? 0,
                                      isBulkShared: feed.isBulkShared,
                                    })
                                  }}
                                  className="cursor-pointer py-2.5"
                                >
                                  <ShareIcon className="h-4 w-4" />
                                  <span>Bulk Share</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setDeletingFeed({
                                      id: feed.id,
                                      title: feed.title,
                                    })
                                  }}
                                  className="cursor-pointer py-2.5"
                                >
                                  <Trash2Icon className="h-4 w-4" />
                                  <span>Delete feed</span>
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

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              {userLoading ? (
                <div className="flex items-center gap-3 px-2 py-2">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-accent data-[state=open]:text-accent-foreground hover:bg-accent/50 h-auto w-full py-2.5 transition-colors"
                    >
                      <Avatar className="border-border/50 h-10 w-10 shrink-0 border-2">
                        <AvatarImage src={user.image ?? undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                        <span className="truncate text-sm leading-tight font-semibold">
                          {user.name ?? user.username}
                        </span>
                        <span className="text-muted-foreground truncate text-xs leading-tight">
                          {user.email}
                        </span>
                      </div>
                      <ChevronUpIcon className="text-foreground ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    side="top"
                    className="w-64"
                    sideOffset={8}
                  >
                    <div className="flex items-start gap-3 px-2 py-3">
                      <Avatar className="border-border/50 h-10 w-10 shrink-0 border-2">
                        <AvatarImage src={user.image ?? undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <p className="truncate text-sm font-semibold">
                          {user.name ?? user.username}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        setTheme(theme === "dark" ? "light" : "dark")
                      }
                      className="cursor-pointer py-2.5"
                    >
                      {theme === "dark" ? (
                        <SunIcon className="h-4 w-4" />
                      ) : (
                        <MoonIcon className="h-4 w-4" />
                      )}
                      <span>
                        {theme === "dark"
                          ? "Switch to light mode"
                          : "Switch to dark mode"}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer py-2.5">
                      <Link href="/settings">
                        <SettingsIcon className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <form action={logout} className="w-full">
                        <button
                          type="submit"
                          className="flex w-full cursor-pointer items-center gap-2 py-2.5"
                        >
                          <LogOutIcon className="h-4 w-4" />
                          <span>Log out</span>
                        </button>
                      </form>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
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
          onDeleteSuccess={() => {
            if (selectedTag?.id === deletingTag.id) {
              void setTagSlug(null)
            }
          }}
        />
      )}

      {bulkSharingFeed && (
        <BulkShareDialog
          isOpen={true}
          onClose={() => setBulkSharingFeed(null)}
          feedId={bulkSharingFeed.id}
          feedTitle={bulkSharingFeed.title}
          articleCount={bulkSharingFeed.articleCount}
          isBulkShared={bulkSharingFeed.isBulkShared}
        />
      )}
    </>
  )
}
