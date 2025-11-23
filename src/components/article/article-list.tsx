"use client"

import { useEffect, useMemo, useRef } from "react"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { FileTextIcon, Loader2Icon } from "lucide-react"
import { parseAsString, useQueryState } from "nuqs"

import type { FilterType } from "@/components/feed/feed-filter"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingSkeleton } from "@/components/shared/loading-skeleton"
import { ScrollToTopButton } from "@/components/shared/scroll-to-top-button"
import { useTRPC } from "@/lib/trpc/client"
import { ArticleCard } from "./article-card"

export function ArticleList() {
  const [feedSlug] = useQueryState("feed", parseAsString.withDefault(""))
  const [filter] = useQueryState("filter", parseAsString.withDefault("all"))
  const [selectedArticleId, setSelectedArticleId] = useQueryState(
    "article",
    parseAsString,
  )

  const trpc = useTRPC()
  const observerTarget = useRef<HTMLDivElement>(null)

  const { data: allFeeds } = useQuery(
    trpc.feed.all.queryOptions({
      page: 1,
      perPage: 100,
    }),
  )

  const selectedFeedId = useMemo(() => {
    if (!feedSlug || !allFeeds) return undefined
    const feed = allFeeds.find((f: { slug: string }) => f.slug === feedSlug)
    return feed?.id
  }, [feedSlug, allFeeds])

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      ...trpc.article.byFilterInfinite.infiniteQueryOptions({
        filter: filter as FilterType,
        feedId: selectedFeedId,
        limit: 50,
      }),
      getNextPageParam: (lastPage) => lastPage?.nextCursor ?? null,
      initialPageParam: null as string | null,
    })

  const articles = useMemo(
    () => data?.pages.flatMap((page) => page?.articles ?? []) ?? [],
    [data],
  )

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { threshold: 0.1 },
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
      observer.disconnect()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex-1 space-y-3 p-4 md:mx-auto md:max-w-4xl md:px-6">
        {isLoading ? (
          <LoadingSkeleton variant="list" count={5} />
        ) : articles.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              title="No articles found"
              description="Try changing your filter or adding more feeds"
              icon={<FileTextIcon className="h-12 w-12" />}
            />
          </div>
        ) : (
          <>
            {articles
              .filter((article) => {
                // Runtime check: filter out articles with null/undefined feed
                // This can occur when feeds are deleted but articles remain orphaned
                return (article.feed as unknown) !== null
              })
              .map((article) => (
                <ArticleCard
                  key={article.id}
                  id={article.id}
                  title={article.title}
                  slug={article.slug}
                  description={article.description}
                  feedTitle={article.feed.title}
                  feedSlug={article.feed.slug}
                  feedImageUrl={article.feed.imageUrl}
                  imageUrl={article.imageUrl}
                  pubDate={article.pubDate}
                  isRead={article.isRead}
                  isFavorited={article.isFavorited}
                  isReadLater={article.isReadLater}
                  isSelected={selectedArticleId === article.id}
                  onSelect={setSelectedArticleId}
                />
              ))}

            <div ref={observerTarget} className="h-4" />

            {isFetchingNextPage && (
              <div className="flex items-center justify-center py-4">
                <Loader2Icon className="text-muted-foreground h-6 w-6 animate-spin" />
              </div>
            )}

            {!hasNextPage && articles.length > 0 && (
              <div className="text-muted-foreground py-4 text-center text-sm">
                No more articles
              </div>
            )}
          </>
        )}
      </div>

      <ScrollToTopButton />
    </div>
  )
}
