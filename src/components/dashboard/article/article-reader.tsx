"use client"

import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"

import { EmptyState } from "@/components/dashboard/shared/empty-state"
import { GlassCard } from "@/components/dashboard/shared/glass-card"
import { LoadingSkeleton } from "@/components/dashboard/shared/loading-skeleton"
import { useTRPC } from "@/lib/trpc/client"
import { ArticleActions } from "./article-actions"

interface ArticleWithFeed {
  id: string
  title: string
  description: string | null
  content: string | null
  imageUrl: string | null
  link: string
  pubDate: Date
  isRead: boolean
  isStarred: boolean
  isReadLater: boolean
  feed: {
    title: string
    imageUrl: string | null
  }
}

interface ArticleReaderProps {
  articleId: string | null
}

export function ArticleReader({ articleId }: ArticleReaderProps) {
  const trpc = useTRPC()
  const { data: article, isLoading } = useQuery({
    ...trpc.article.byId.queryOptions(articleId!),
    enabled: !!articleId,
  }) as { data: ArticleWithFeed | undefined; isLoading: boolean }

  if (!articleId) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          title="No article selected"
          description="Select an article from the list to read"
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <LoadingSkeleton variant="text" count={8} className="h-6" />
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          title="Article not found"
          description="The article you're looking for doesn't exist"
        />
      </div>
    )
  }

  const feed = article.feed

  return (
    <div className="flex h-full flex-col">
      <ArticleActions
        articleId={article.id}
        isRead={article.isRead}
        isStarred={article.isStarred}
        isReadLater={article.isReadLater}
        link={article.link}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl p-6">
          {/* Article Header */}
          <div className="mb-6">
            <h1 className="text-foreground mb-4 text-3xl font-bold">
              {article.title}
            </h1>

            <div className="text-muted-foreground flex items-center gap-3 text-sm">
              {feed.imageUrl && (
                <Image
                  src={feed.imageUrl}
                  alt={feed.title}
                  width={20}
                  height={20}
                  className="h-5 w-5 rounded"
                />
              )}
              <span>{feed.title}</span>
              <span>•</span>
              <span>{dayjs(article.pubDate).format("MMM D, YYYY")}</span>
            </div>
          </div>

          {/* Article Image */}
          {article.imageUrl && (
            <div className="mb-6 overflow-hidden rounded-lg">
              <Image
                src={article.imageUrl}
                alt={article.title}
                width={800}
                height={400}
                className="h-auto w-full"
              />
            </div>
          )}

          {/* Article Description */}
          {article.description && (
            <div className="mb-6">
              <p className="text-foreground/90 text-lg leading-relaxed">
                {article.description}
              </p>
            </div>
          )}

          {/* Article Content */}
          {article.content ? (
            <GlassCard className="p-6">
              <div
                className="prose prose-invert prose-lg prose-headings:text-foreground prose-p:text-foreground/90 prose-a:text-primary hover:prose-a:text-primary/80 prose-strong:text-foreground prose-code:text-foreground/90 prose-pre:bg-muted prose-img:rounded-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </GlassCard>
          ) : (
            <GlassCard className="p-6">
              <p className="text-muted-foreground text-center">
                No content available. Click "Open Original" to read the full
                article.
              </p>
            </GlassCard>
          )}

          {/* Footer Spacing */}
          <div className="h-12" />
        </div>
      </div>
    </div>
  )
}
