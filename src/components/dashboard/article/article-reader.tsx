"use client"

import { useEffect } from "react"
import Image from "next/image"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"

import { EmptyState } from "@/components/dashboard/shared/empty-state"
import { LoadingSkeleton } from "@/components/dashboard/shared/loading-skeleton"
import { Separator } from "@/components/ui/separator"
import { useTRPC } from "@/lib/trpc/client"
import { sanitizeHtml, stripHtml } from "@/lib/utils/html"
import { ArticleActions } from "./article-actions"

interface ArticleWithFeed {
  id: string
  title: string
  slug: string
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
    slug: string
    imageUrl: string | null
  }
}

interface ArticleReaderProps {
  articleId: string | null
}

export function ArticleReader({ articleId }: ArticleReaderProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data: article, isLoading } = useQuery({
    ...trpc.article.byId.queryOptions(articleId!),
    enabled: !!articleId,
  }) as { data: ArticleWithFeed | undefined; isLoading: boolean }

  const markAsRead = useMutation(
    trpc.article.updateReadStatus.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.article.pathFilter())
        await queryClient.invalidateQueries(trpc.feed.pathFilter())
      },
    }),
  )

  // Automatically mark article as read when opened
  useEffect(() => {
    if (article && !article.isRead) {
      markAsRead.mutate({ id: article.id, isRead: true })
    }
  }, [article, markAsRead])

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
      <div className="h-full overflow-y-auto p-3 md:p-6">
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
        isStarred={article.isStarred}
        isReadLater={article.isReadLater}
        link={article.link}
        feedSlug={article.feed.slug}
        articleSlug={article.slug}
      />

      <div className="flex-1 overflow-y-auto">
        <article className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8 lg:px-8">
          {/* Article Header */}
          <header className="mb-6 space-y-4 md:mb-8">
            <h1 className="text-foreground text-3xl leading-tight font-bold tracking-tight md:text-4xl lg:text-5xl">
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
              <span className="font-medium">{feed.title}</span>
              <span className="text-muted-foreground/60">•</span>
              <time dateTime={article.pubDate.toISOString()}>
                {dayjs(article.pubDate).format("MMMM D, YYYY")}
              </time>
            </div>

            <Separator />
          </header>

          {/* Article Image */}
          {article.imageUrl && (
            <figure className="mb-6 overflow-hidden rounded-lg md:mb-8 md:rounded-xl">
              <Image
                src={article.imageUrl}
                alt={article.title}
                width={800}
                height={450}
                className="h-auto w-full object-cover"
                priority
              />
            </figure>
          )}

          {/* Article Description */}
          {article.description && (
            <div className="mb-6 md:mb-8">
              <p className="text-foreground/90 text-lg leading-relaxed md:text-xl">
                {stripHtml(article.description)}
              </p>
            </div>
          )}

          {/* Article Content */}
          {article.content ? (
            <div className="border-border bg-card rounded-lg border p-4 md:rounded-xl md:p-6 lg:p-8">
              <div
                className="prose prose-neutral dark:prose-invert prose-sm md:prose-base lg:prose-lg prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-2xl md:prose-h1:text-3xl prose-h2:text-xl md:prose-h2:text-2xl prose-h3:text-lg md:prose-h3:text-xl prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold prose-img:rounded-lg prose-img:shadow-md prose-pre:bg-muted prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none max-w-none"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(article.content),
                }}
              />
            </div>
          ) : (
            <div className="border-border bg-muted/30 rounded-lg border p-6 text-center md:rounded-xl md:p-8">
              <p className="text-muted-foreground text-sm md:text-base">
                No content available. Click{" "}
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-medium hover:underline"
                >
                  Open Original
                </a>{" "}
                to read the full article.
              </p>
            </div>
          )}

          {/* Footer Spacing */}
          <div className="h-12 md:h-16" />
        </article>
      </div>
    </div>
  )
}
