"use client"

import { useQuery } from "@tanstack/react-query"

import type { FilterType } from "@/components/dashboard/feed/feed-filter"
import { EmptyState } from "@/components/dashboard/shared/empty-state"
import { GlassCard } from "@/components/dashboard/shared/glass-card"
import { LoadingSkeleton } from "@/components/dashboard/shared/loading-skeleton"
import { useTRPC } from "@/lib/trpc/client"
import { ArticleCard } from "./article-card"

interface ArticleWithFeed {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  pubDate: Date
  isRead: boolean
  isStarred: boolean
  isReadLater: boolean
  feed: {
    title: string
    imageUrl: string | null
  }
}

interface ArticleListProps {
  activeFilter: FilterType
  selectedFeedId: string | null
  selectedArticleId: string | null
  onArticleSelect: (articleId: string) => void
}

export function ArticleList({
  activeFilter,
  selectedFeedId,
  selectedArticleId,
  onArticleSelect,
}: ArticleListProps) {
  const trpc = useTRPC()

  const { data: articles, isLoading } = useQuery(
    trpc.article.byFilter.queryOptions({
      filter: activeFilter,
      feedId: selectedFeedId ?? undefined,
    }),
  ) as { data: ArticleWithFeed[] | undefined; isLoading: boolean }

  return (
    <GlassCard className="flex flex-1 flex-col overflow-hidden">
      <div className="border-border border-b p-4">
        <h2 className="text-foreground text-lg font-bold">Articles</h2>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {isLoading ? (
          <LoadingSkeleton variant="list" count={5} />
        ) : !articles || articles.length === 0 ? (
          <EmptyState
            title="No articles found"
            description="Try changing your filter or adding more feeds"
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
          />
        ) : (
          articles.map((article) => (
            <ArticleCard
              key={article.id}
              id={article.id}
              title={article.title}
              description={article.description ?? ""}
              feedTitle={article.feed.title}
              feedImageUrl={article.feed.imageUrl}
              imageUrl={article.imageUrl}
              pubDate={article.pubDate}
              isRead={article.isRead}
              isStarred={article.isStarred}
              isReadLater={article.isReadLater}
              isSelected={selectedArticleId === article.id}
              onSelect={onArticleSelect}
            />
          ))
        )}
      </div>
    </GlassCard>
  )
}
