"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  BookmarkIcon,
  CalendarIcon,
  ChevronUpIcon,
  ClockIcon,
  InboxIcon,
  ListIcon,
  LogOutIcon,
  MoonIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  RssIcon,
  SearchIcon,
  SettingsIcon,
  StarIcon,
  SunIcon,
  Trash2Icon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { parseAsString, useQueryState } from "nuqs"

import { AddFeedDialog } from "@/components/feed/add-feed-dialog"
import { AddTagDialog } from "@/components/feed/add-tag-dialog"
import { DeleteFeedDialog } from "@/components/feed/delete-feed-dialog"
import { DeleteTagDialog } from "@/components/feed/delete-tag-dialog"
import { EditFeedDialog } from "@/components/feed/edit-feed-dialog"
import { EditTagDialog } from "@/components/feed/edit-tag-dialog"
import Link from "@/components/link"
import { EmptyState } from "@/components/shared/empty-state"
import { useGlobalSearch } from "@/components/shared/global-search"
import { LoadingSkeleton } from "@/components/shared/loading-skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu"
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
import { toast } from "@/components/ui/toast"
import { logout } from "@/lib/auth/logout"
import { queryApi } from "@/lib/orpc/query"
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
  { value: "recentlyRead" as const, label: "Recently Read", icon: ClockIcon },
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

  const queryClient = useQueryClient()
  const { setOpenMobile, isMobile } = useSidebar()
  const { setOpen: setSearchOpen } = useGlobalSearch()

  const { data: feeds, isLoading: feedsLoading } = useQuery(
    queryApi.feed.all.queryOptions({
      input: {
        page: 1,
        perPage: 100,
      },
    }),
  )

  const { data: statistics } = useQuery(queryApi.feed.statistics.queryOptions())

  const { data: tags } = useQuery(queryApi.tag.all.queryOptions())

  const { data: user, isLoading: userLoading } = useQuery(
    queryApi.user.getCurrentUser.queryOptions(),
  )

  const { data: userSettings } = useQuery(
    queryApi.user.getSettings.queryOptions(),
  ) as { data: { showFilterCountBadges: boolean } | undefined }

  const { theme, setTheme } = useTheme()

  const refreshAll = useMutation(
    queryApi.feed.refreshAll.mutationOptions({
      onSuccess: async (data) => {
        if (data) {
          await queryClient.invalidateQueries({
            queryKey: queryApi.feed.key(),
          })
          await queryClient.invalidateQueries({
            queryKey: queryApi.article.key(),
          })
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
    queryApi.feed.toggleFavorited.mutationOptions({
      onSuccess: async (data) => {
        if (data) {
          await queryClient.invalidateQueries({
            queryKey: queryApi.feed.key(),
          })
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
    queryApi.tag.toggleFavorited.mutationOptions({
      onSuccess: async (data) => {
        if (data) {
          await queryClient.invalidateQueries({
            queryKey: queryApi.tag.key(),
          })
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
    recentlyRead:
      statistics?.reduce(
        (acc: number, s: { recentlyReadCount?: number }) =>
          acc + (s.recentlyReadCount ?? 0),
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
                <span>Add Source</span>
              </Button>
              <Button
                onClick={() => refreshAll.mutate({})}
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
                  {refreshAll.isPending ? "Refreshing..." : "Refresh"}
                </span>
              </Button>
              <Button
                onClick={() => setSearchOpen(true)}
                className="mt-2 w-full"
                size="sm"
                variant="outline"
              >
                <SearchIcon className="h-4 w-4" />
                <span>Search</span>
                <kbd className="bg-muted text-muted-foreground ml-auto hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-xs font-medium opacity-100 select-none sm:inline-flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
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
                  const showBadges = userSettings?.showFilterCountBadges ?? true

                  return (
                    <SidebarMenuItem key={filterItem.value}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => {
                          void setFilter(isActive ? "all" : filterItem.value)
                          if (isMobile) setOpenMobile(false)
                        }}
                        className={cn(
                          "group cursor-pointer",
                          isActive && "bg-accent",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="truncate text-sm font-medium">
                          {filterItem.label}
                        </span>
                        {showBadges && count > 0 && (
                          <Badge
                            variant={isActive ? "secondary" : "outline"}
                            className="ml-auto rounded-xl px-2 py-0.5"
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
                            isActive={isSelected}
                            onClick={() => {
                              void setFeedSlug(isSelected ? "" : feed.slug)
                              void setTagSlug(null)
                              if (isMobile) setOpenMobile(false)
                            }}
                            className={cn(
                              "group cursor-pointer",
                              isSelected && "bg-accent",
                            )}
                          >
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarImage src={feed.imageUrl ?? undefined} />
                              <AvatarFallback className="text-xs">
                                {feed.title.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate text-sm font-medium">
                              {feed.title}
                            </span>
                            <StarIcon
                              className="ml-auto h-3.5 w-3.5 shrink-0 cursor-pointer fill-current text-yellow-500 transition-opacity hover:opacity-70"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFeedFavorited.mutate({
                                  id: feed.id,
                                  isFavorited: false,
                                })
                              }}
                            />
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
                            isActive={isSelected}
                            onClick={() => {
                              void setTagSlug(isSelected ? null : tag.id)
                              void setFeedSlug("")
                              if (isMobile) setOpenMobile(false)
                            }}
                            className={cn(
                              "group cursor-pointer",
                              isSelected && "bg-accent",
                            )}
                          >
                            <span className="truncate text-sm font-medium">
                              {tag.name}
                            </span>
                            <StarIcon
                              className="ml-auto h-3.5 w-3.5 shrink-0 cursor-pointer fill-current text-yellow-500 transition-opacity hover:opacity-70"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleTagFavorited.mutate({
                                  id: tag.id,
                                  isFavorited: false,
                                })
                              }}
                            />
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
                      <span className="cursor-pointer truncate text-sm font-medium">
                        All
                      </span>
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
                        className="flex items-center gap-1"
                      >
                        <SidebarMenuButton
                          isActive={isSelected}
                          onClick={() => {
                            void setTagSlug(isSelected ? null : tag.id)
                            if (isMobile) setOpenMobile(false)
                          }}
                          className={cn(
                            "group flex-1 cursor-pointer",
                            isSelected && "bg-accent",
                          )}
                        >
                          <span className="truncate text-sm font-medium">
                            {tag.name}
                          </span>
                        </SidebarMenuButton>
                        <Menu modal={false}>
                          <MenuTrigger
                            onClick={(e) => {
                              e.stopPropagation()
                            }}
                            className={cn(
                              "hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring h-6 w-6 shrink-0 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:ring-1 focus-visible:outline-none",
                              isHovered ? "inline-flex" : "hidden",
                            )}
                          >
                            <span className="sr-only">More options</span>
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </MenuTrigger>
                          <MenuPopup
                            align="end"
                            side="bottom"
                            className="w-48"
                            sideOffset={8}
                          >
                            <MenuItem
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
                            </MenuItem>
                            <MenuItem
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
                            </MenuItem>
                            <MenuSeparator />
                            <MenuItem
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
                            </MenuItem>
                          </MenuPopup>
                        </Menu>
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
                    <LoadingSkeleton variant="sidebar-feed" count={5} />
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
                    const showBadges =
                      userSettings?.showFilterCountBadges ?? true

                    return (
                      <SidebarMenuItem
                        key={feed.id}
                        onMouseEnter={() => setHoveredFeedId(feed.id)}
                        onMouseLeave={() => setHoveredFeedId(null)}
                        className="flex items-center gap-1"
                      >
                        <SidebarMenuButton
                          isActive={isSelected}
                          onClick={() => {
                            void setFeedSlug(isSelected ? "" : feed.slug)
                            if (isMobile) setOpenMobile(false)
                          }}
                          className={cn(
                            "group h-auto flex-1 cursor-pointer py-2",
                            isSelected && "bg-accent",
                          )}
                        >
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
                          {showBadges && feed.unreadCount > 0 && (
                            <Badge
                              variant={isSelected ? "secondary" : "outline"}
                              className="ml-auto rounded-xl px-2 py-0.5"
                            >
                              {feed.unreadCount}
                            </Badge>
                          )}
                        </SidebarMenuButton>
                        <Menu modal={false}>
                          <MenuTrigger
                            render={(props) => (
                              <button
                                {...props}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  props.onClick?.(e)
                                }}
                                className={cn(
                                  "hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring h-6 w-6 shrink-0 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:ring-1 focus-visible:outline-none",
                                  isHovered ? "inline-flex" : "hidden",
                                )}
                              >
                                <span className="sr-only">More options</span>
                                <MoreHorizontalIcon className="h-4 w-4" />
                              </button>
                            )}
                          />
                          <MenuPopup
                            align="end"
                            side="bottom"
                            className="w-48"
                            sideOffset={8}
                          >
                            <MenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                const feedToEdit = (
                                  feeds as FeedWithTags[] | undefined
                                )?.find((f) => f.id === feed.id)
                                if (feedToEdit) {
                                  const tagIds =
                                    feedToEdit.tags?.map((t) => t.tag.id) ?? []
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
                            </MenuItem>
                            <MenuItem
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
                            </MenuItem>
                            <MenuSeparator />
                            <MenuItem
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
                            </MenuItem>
                          </MenuPopup>
                        </Menu>
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
                <Menu>
                  <MenuTrigger
                    render={(props) => (
                      <SidebarMenuButton
                        {...props}
                        size="lg"
                        className="data-[state=open]:bg-accent data-[state=open]:text-accent-foreground hover:bg-accent/50 h-auto w-full py-2.5 transition-colors"
                      >
                        <Avatar className="border-border/50 h-10 w-10 shrink-0 border">
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
                    )}
                  />
                  <MenuPopup
                    align="end"
                    side="top"
                    className="w-64"
                    sideOffset={8}
                  >
                    <div className="flex items-start gap-3 px-2 py-3">
                      <Avatar className="border-border/50 h-10 w-10 shrink-0 border">
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
                    <MenuSeparator />
                    <MenuItem
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
                    </MenuItem>
                    <MenuItem
                      render={(props) => (
                        <Link
                          {...props}
                          href="/settings"
                          className="inline-flex cursor-pointer items-center gap-2 px-2 py-2.5"
                        >
                          <SettingsIcon className="size-4" />
                          <span>Settings</span>
                        </Link>
                      )}
                    />
                    <MenuSeparator />
                    <MenuItem
                      render={(props) => (
                        <form {...props} action={logout} className="w-full">
                          <button
                            type="submit"
                            className="flex w-full cursor-pointer items-center gap-2 px-2 py-2.5"
                          >
                            <LogOutIcon className="h-4 w-4" />
                            <span>Log out</span>
                          </button>
                        </form>
                      )}
                    />
                  </MenuPopup>
                </Menu>
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
    </>
  )
}
