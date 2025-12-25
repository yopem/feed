"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import { ExternalLinkIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { LoadingSkeleton } from "@/components/shared/loading-skeleton"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { queryApi } from "@/lib/orpc/query"
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
  isFavorited: boolean
  isReadLater: boolean
  redditPermalink: string | null
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
  const queryClient = useQueryClient()
  const hasMarkedAsRead = useRef<Set<string>>(new Set())

  const { data: article, isLoading } = useQuery(
    queryApi.article.byId.queryOptions({
      input: articleId!,
      enabled: !!articleId,
    }),
  ) as { data: ArticleWithFeed | undefined; isLoading: boolean }

  const markAsRead = useMutation(
    queryApi.article.updateReadStatus.mutationOptions({
      onSuccess: async (data) => {
        if (data?.id && articleId) {
          await queryClient.invalidateQueries({
            predicate: (query) => {
              const queryKey = query.queryKey as unknown[]
              return Boolean(
                queryKey[0] === "article" &&
                queryKey[1] === "byId" &&
                queryKey[2] &&
                typeof queryKey[2] === "object" &&
                "input" in queryKey[2] &&
                queryKey[2].input === articleId,
              )
            },
          })
        }
        await queryClient.invalidateQueries({
          queryKey: queryApi.article.key(),
        })
        await queryClient.invalidateQueries({
          queryKey: queryApi.feed.key(),
        })
      },
    }),
  )

  useEffect(() => {
    if (
      article &&
      !article.isRead &&
      !hasMarkedAsRead.current.has(article.id)
    ) {
      hasMarkedAsRead.current.add(article.id)
      markAsRead.mutate({ id: article.id, isRead: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article?.id, article?.isRead])

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
        articleTitle={article.title}
        isFavorited={article.isFavorited}
        isReadLater={article.isReadLater}
        link={article.link}
      />

      <div className="flex-1 overflow-y-auto">
        <article className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8 lg:px-8">
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

            {article.redditPermalink && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  render={(props) => (
                    <a
                      href={`https://www.reddit.com${article.redditPermalink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    >
                      <ExternalLinkIcon className="h-4 w-4" />
                      View Discussion on Reddit
                    </a>
                  )}
                />
              </div>
            )}

            <Separator />
          </header>

          {article.imageUrl && (
            <figure className="mb-6 overflow-hidden rounded-xl md:mb-8">
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

          {article.description && (
            <div className="mb-6 md:mb-8">
              <p className="text-foreground/90 text-lg leading-relaxed md:text-xl">
                {stripHtml(article.description)}
              </p>
            </div>
          )}

          {article.content ? (
            <div className="bg-card border-border rounded-lg border p-6 shadow-lg md:rounded-xl md:p-8 lg:p-10">
              <div
                className="prose prose-neutral dark:prose-invert prose-sm md:prose-base lg:prose-lg prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-2xl md:prose-h1:text-3xl prose-h2:text-xl md:prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-lg md:prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:leading-relaxed prose-p:my-4 prose-ul:my-6 prose-ol:my-6 prose-li:my-1.5 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold prose-img:rounded-lg prose-img:shadow-md prose-img:my-6 prose-figure:my-6 prose-hr:my-8 prose-hr:border-border prose-pre:bg-muted prose-pre:my-4 prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none max-w-none space-y-4 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(article.content),
                }}
              />
            </div>
          ) : (
            <div className="bg-muted/30 border-border rounded-lg border p-6 text-center shadow-md md:rounded-xl md:p-8">
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

          <div className="h-12 md:h-16" />
        </article>
      </div>
    </div>
  )
}
