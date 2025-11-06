"use client"

import { useQuery } from "@tanstack/react-query"
import { FileTextIcon } from "lucide-react"

import type { FilterType } from "@/components/dashboard/feed/feed-filter"
import { EmptyState } from "@/components/dashboard/shared/empty-state"
import { LoadingSkeleton } from "@/components/dashboard/shared/loading-skeleton"
import { SurfaceCard } from "@/components/dashboard/shared/surface-card"
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
  } | null
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
    <SurfaceCard className="flex flex-1 flex-col overflow-hidden">
      <div className="panel-header">
        <h2 className="text-foreground text-xs leading-4 font-medium">
          Articles
        </h2>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {isLoading ? (
          <LoadingSkeleton variant="list" count={5} />
        ) : !articles || articles.length === 0 ? (
          <EmptyState
            title="No articles found"
            description="Try changing your filter or adding more feeds"
            icon={<FileTextIcon className="h-12 w-12" />}
          />
        ) : (
          articles.map((article) => (
            <ArticleCard
              key={article.id}
              id={article.id}
              title={article.title}
              description={article.description ?? ""}
              feedTitle={article.feed?.title ?? "Unknown Feed"}
              feedImageUrl={article.feed?.imageUrl ?? null}
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
    </SurfaceCard>
  )
}
