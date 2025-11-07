import type { Metadata } from "next"
import { unstable_noStore as noStore } from "next/cache"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import dayjs from "dayjs"
import { ChevronLeftIcon } from "lucide-react"

import { ArticleActions } from "@/components/dashboard/article/article-actions"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { appRouter } from "@/lib/api/root"
import { createTRPCContext } from "@/lib/api/trpc"
import { auth } from "@/lib/auth/session"
import { sanitizeHtml, stripHtml } from "@/lib/utils/html"

interface PageProps {
  params: Promise<{
    username: string
    feedSlug: string
    articleSlug: string
  }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const session = await auth()

  if (!session) {
    return {
      title: "Article Not Found",
    }
  }

  const { username, feedSlug, articleSlug } = await params

  if (session.username !== username) {
    return {
      title: "Article Not Found",
    }
  }

  try {
    const ctx = await createTRPCContext({
      headers: new Headers(),
    })
    const caller = appRouter.createCaller(ctx)

    const article = await caller.article.byFeedAndArticleSlug({
      feedSlug,
      articleSlug,
    })

    if (!article) {
      return {
        title: "Article Not Found",
      }
    }

    const description = article.description
      ? stripHtml(article.description).slice(0, 160)
      : `Read ${article.title} on ${article.feed.title}`

    return {
      title: `${article.title} - ${article.feed.title}`,
      description,
      openGraph: {
        title: article.title,
        description,
        type: "article",
        publishedTime: article.pubDate.toISOString(),
        images: article.imageUrl
          ? [
              {
                url: article.imageUrl,
                alt: article.title,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: article.title,
        description,
        images: article.imageUrl ? [article.imageUrl] : undefined,
      },
    }
  } catch {
    return {
      title: "Article Not Found",
    }
  }
}

export default async function ArticlePage({ params }: PageProps) {
  noStore()
  const session = await auth()

  if (!session) {
    redirect("/auth/login")
  }

  const { username, feedSlug, articleSlug } = await params

  if (session.username !== username) {
    redirect("/dashboard")
  }

  const ctx = await createTRPCContext({
    headers: new Headers(),
  })
  const caller = appRouter.createCaller(ctx)

  const article = await caller.article.byFeedAndArticleSlug({
    feedSlug,
    articleSlug,
  })

  if (!article) {
    redirect("/dashboard")
  }

  const feed = article.feed

  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass sticky top-0 z-10 border-b px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ChevronLeftIcon className="h-4 w-4" />
              <span>Back</span>
            </Link>
          </Button>

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/dashboard?feed=${feedSlug}`}>
                  {feed.title}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1">
                  {article.title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="border-b px-4 py-2">
        <div className="mx-auto max-w-4xl">
          <ArticleActions
            articleId={article.id}
            isStarred={article.isStarred}
            isReadLater={article.isReadLater}
            link={article.link}
            feedSlug={feedSlug}
            articleSlug={articleSlug}
          />
        </div>
      </div>

      <main className="flex-1">
        <article className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
          <header className="mb-8 space-y-4">
            <h1 className="text-foreground text-4xl leading-tight font-bold tracking-tight lg:text-5xl">
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

          {article.imageUrl && (
            <figure className="mb-8 overflow-hidden rounded-xl">
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
            <div className="mb-8">
              <p className="text-foreground/90 text-xl leading-relaxed">
                {stripHtml(article.description)}
              </p>
            </div>
          )}

          {article.content ? (
            <div className="border-border bg-card rounded-xl border p-6 lg:p-8">
              <div
                className="prose prose-neutral dark:prose-invert prose-lg prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold prose-img:rounded-lg prose-img:shadow-md max-w-none"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(article.content),
                }}
              />
            </div>
          ) : (
            <div className="border-border bg-muted/30 rounded-xl border p-8 text-center">
              <p className="text-muted-foreground text-base">
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

          <div className="h-16" />
        </article>
      </main>
    </div>
  )
}
