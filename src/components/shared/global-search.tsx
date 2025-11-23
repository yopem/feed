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
import { useTRPC } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"

interface GlobalSearchContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const GlobalSearchContext = createContext<GlobalSearchContextType | null>(null)

/**
 * Hook to access global search context
 */
export function useGlobalSearch() {
  const context = useContext(GlobalSearchContext)
  if (!context) {
    throw new Error("useGlobalSearch must be used within GlobalSearchProvider")
  }
  return context
}

/**
 * Global search provider component
 */
export function GlobalSearchProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const trpc = useTRPC()

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

  const { data, isLoading } = useQuery({
    ...trpc.article.search.queryOptions({
      query: debouncedQuery,
      limit: 20,
    }),
    enabled: debouncedQuery.length >= 2 && open,
  })

  const allResults = useMemo(
    () => [
      ...(data?.feeds.map((feed) => ({ type: "feed" as const, item: feed })) ??
        []),
      ...(data?.articles.map((article) => ({
        type: "article" as const,
        item: article,
      })) ?? []),
    ],
    [data],
  )

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
      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <Command onKeyDown={handleKeyDown}>
          <CommandInput
            placeholder="Search articles and feeds..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <CommandList>
            {query.length < 2 ? (
              <CommandEmpty>Type at least 2 characters to search</CommandEmpty>
            ) : isLoading ? (
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
                          selected={selectedIndex === globalIndex}
                          onSelect={() =>
                            handleSelect({ type: "feed", item: feed })
                          }
                          className={cn(
                            selectedIndex === globalIndex && "bg-accent",
                          )}
                        >
                          <RssIcon className="h-4 w-4 shrink-0" />
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
                          selected={selectedIndex === globalIndex}
                          onSelect={() =>
                            handleSelect({ type: "article", item: article })
                          }
                          className={cn(
                            selectedIndex === globalIndex && "bg-accent",
                          )}
                        >
                          <FileTextIcon className="h-4 w-4 shrink-0" />
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
    </GlobalSearchContext.Provider>
  )
}
