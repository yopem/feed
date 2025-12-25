"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { FileTextIcon, RssIcon } from "lucide-react"
import { parseAsString, useQueryState } from "nuqs"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut"
import { queryApi } from "@/lib/orpc/query"
import { cn } from "@/lib/utils"

interface GlobalSearchContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const GlobalSearchContext = createContext<GlobalSearchContextType | null>(null)

export function useGlobalSearch() {
  const context = useContext(GlobalSearchContext)
  if (!context) {
    throw new Error("useGlobalSearch must be used within GlobalSearchProvider")
  }
  return context
}

export function GlobalSearchProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const [, setFeedSlug] = useQueryState("feed", parseAsString.withDefault(""))
  const [, setFilter] = useQueryState(
    "filter",
    parseAsString.withDefault("all"),
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 200)

    return () => clearTimeout(timer)
  }, [query])

  const { data, isFetching, error, refetch } = useQuery(
    queryApi.article.search.queryOptions({
      input: {
        query: debouncedQuery,
        limit: 20,
      },
      enabled: debouncedQuery.length >= 2 && open,
      retry: 1,
      staleTime: 1000 * 60,
    }),
  )

  // Show searching only when fetching AND no data exists yet
  const isSearching = isFetching && debouncedQuery.length >= 2 && !data

  const allResults = useMemo(() => {
    const feeds = data?.feeds ?? []
    const articles = data?.articles ?? []

    return [
      ...feeds.map((feed) => ({ type: "feed" as const, item: feed })),
      ...articles.map((article) => ({
        type: "article" as const,
        item: article,
      })),
    ]
  }, [data])

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setQuery("")
      setSelectedIndex(0)
    }
  }, [])

  useKeyboardShortcut(
    "k",
    () => {
      setOpen((prev) => !prev)
    },
    {
      ctrl: !navigator.platform.includes("Mac"),
      meta: navigator.platform.includes("Mac"),
    },
  )

  useKeyboardShortcut(
    "Escape",
    () => {
      if (open) {
        setOpen(false)
      }
    },
    {},
  )

  useEffect(() => {
    if (!open) {
      setSelectedIndex(0)
    }
  }, [query, open])

  const [, setArticleId] = useQueryState("article", parseAsString)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < allResults.length - 1 ? prev + 1 : 0,
        )
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : allResults.length - 1,
        )
      } else if (e.key === "Enter") {
        e.preventDefault()
        const selected = allResults[selectedIndex]
        if (selected.type === "feed") {
          const feed = selected.item as { slug: string }
          void setFeedSlug(feed.slug)
          void setFilter("all")
          router.push("/")
        } else {
          const article = selected.item as {
            id: string
            slug: string
            feed: { slug: string }
          }
          void setArticleId(article.id)
          router.push("/")
        }
        setOpen(false)
      }
    },
    [allResults, selectedIndex, router, setFeedSlug, setFilter, setArticleId],
  )

  const handleSelect = useCallback(
    (result: { type: "feed" | "article"; item: unknown }) => {
      if (result.type === "feed") {
        const feed = result.item as { slug: string }
        void setFeedSlug(feed.slug)
        void setFilter("all")
        router.push("/")
      } else {
        const article = result.item as {
          id: string
          slug: string
          feed: { slug: string }
        }
        void setArticleId(article.id)
        router.push("/")
      }
      setOpen(false)
    },
    [router, setFeedSlug, setFilter, setArticleId],
  )

  return (
    <GlobalSearchContext.Provider value={{ open, setOpen }}>
      {children}
      {mounted && (
        <CommandDialog open={open} onOpenChange={handleOpenChange}>
          <Command onKeyDown={handleKeyDown} shouldFilter={false}>
            <CommandInput
              placeholder="Search articles and feeds..."
              value={query}
              onValueChange={setQuery}
              autoFocus
            />
            <CommandList>
              {debouncedQuery.length < 2 ? (
                <CommandEmpty>
                  Type at least 2 characters to search
                </CommandEmpty>
              ) : error ? (
                <CommandEmpty>
                  <div className="flex flex-col items-center gap-2 py-4">
                    <p className="text-destructive">
                      {error instanceof Error &&
                      error.message.includes("UNAUTHORIZED")
                        ? "Please log in to search"
                        : error instanceof Error &&
                            error.message.includes("Rate limit")
                          ? "Too many searches. Please wait a moment."
                          : "Failed to search. Please try again."}
                    </p>
                    <button
                      onClick={() => refetch()}
                      className="text-primary mt-2 text-sm hover:underline"
                    >
                      Retry
                    </button>
                  </div>
                </CommandEmpty>
              ) : isSearching ? (
                <CommandEmpty>Searching...</CommandEmpty>
              ) : allResults.length === 0 ? (
                <CommandEmpty>
                  No results found. Try a different search term.
                </CommandEmpty>
              ) : (
                <>
                  {data?.feeds && data.feeds.length > 0 && (
                    <CommandGroup heading="Feeds">
                      {data.feeds.map((feed, index) => {
                        const globalIndex = index
                        return (
                          <CommandItem
                            key={feed.id}
                            onSelect={() =>
                              handleSelect({ type: "feed", item: feed })
                            }
                            className={cn(
                              selectedIndex === globalIndex && "bg-accent",
                            )}
                          >
                            {feed.imageUrl ? (
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage
                                  src={feed.imageUrl}
                                  alt={feed.title}
                                />
                                <AvatarFallback>
                                  <RssIcon className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                                <RssIcon className="h-4 w-4" />
                              </div>
                            )}
                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                              <span className="truncate font-medium">
                                {feed.title}
                              </span>
                              {feed.description && (
                                <span className="text-muted-foreground truncate text-xs">
                                  {feed.description}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  )}
                  {data?.articles && data.articles.length > 0 && (
                    <CommandGroup heading="Articles">
                      {data.articles.map((article, index) => {
                        const globalIndex = (data.feeds.length || 0) + index
                        return (
                          <CommandItem
                            key={article.id}
                            onSelect={() =>
                              handleSelect({ type: "article", item: article })
                            }
                            className={cn(
                              selectedIndex === globalIndex && "bg-accent",
                            )}
                          >
                            {article.imageUrl || article.feed.imageUrl ? (
                              <Avatar className="h-8 w-8 shrink-0 rounded-md">
                                <AvatarImage
                                  src={
                                    article.imageUrl ??
                                    article.feed.imageUrl ??
                                    undefined
                                  }
                                  alt={article.title}
                                />
                                <AvatarFallback>
                                  <FileTextIcon className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                                <FileTextIcon className="h-4 w-4" />
                              </div>
                            )}
                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                              <span className="truncate font-medium">
                                {article.title}
                              </span>
                              <span className="text-muted-foreground truncate text-xs">
                                {article.feed.title}
                              </span>
                            </div>
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </CommandDialog>
      )}
    </GlobalSearchContext.Provider>
  )
}
