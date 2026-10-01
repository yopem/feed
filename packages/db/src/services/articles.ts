import { and, desc, eq, ilike, or, sql } from "drizzle-orm"

import { db } from "db/index"
import { articles, readingStates } from "db/schema/articles"
import { feeds } from "db/schema/feeds"
import { requireMembership, ServiceError } from "db/services/access"

export async function listArticles(
  userId: string,
  input: {
    workspaceId: string
    feedId?: string
    view?: "all" | "unread" | "starred" | "saved"
    search?: string
  },
) {
  await requireMembership(userId, input.workspaceId)
  const filters = [eq(feeds.workspaceId, input.workspaceId)]

  if (input.feedId) filters.push(eq(feeds.id, input.feedId))

  if (input.view === "unread")
    filters.push(sql`coalesce(${readingStates.read}, false) = false`)

  if (input.view === "starred") filters.push(eq(readingStates.starred, true))

  if (input.view === "saved") filters.push(eq(readingStates.saved, true))
  const search = input.search?.replaceAll(/[%_\\]/g, "\\$&")

  return db
    .select({
      id: articles.id,
      feedId: feeds.id,
      feedTitle: feeds.title,
      title: articles.title,
      url: articles.url,
      content: articles.content,
      publishedAt: articles.publishedAt,
      read: sql<boolean>`coalesce(${readingStates.read}, false)`,
      starred: sql<boolean>`coalesce(${readingStates.starred}, false)`,
      saved: sql<boolean>`coalesce(${readingStates.saved}, false)`,
    })
    .from(articles)
    .innerJoin(feeds, eq(feeds.id, articles.feedId))
    .leftJoin(
      readingStates,
      and(
        eq(readingStates.articleId, articles.id),
        eq(readingStates.userId, userId),
      ),
    )
    .where(
      and(
        ...filters,
        search
          ? or(
              ilike(articles.title, `%${search}%`),
              ilike(articles.content, `%${search}%`),
            )
          : undefined,
      ),
    )
    .orderBy(
      desc(sql`coalesce(${articles.publishedAt}, ${articles.createdAt})`),
      desc(articles.id),
    )
    .limit(200)
}

export async function setArticleState(
  userId: string,
  input: {
    workspaceId: string
    articleId: string
    read?: boolean
    starred?: boolean
    saved?: boolean
  },
) {
  await requireMembership(userId, input.workspaceId)

  const [article] = await db
    .select({ id: articles.id })
    .from(articles)
    .innerJoin(feeds, eq(feeds.id, articles.feedId))
    .where(
      and(
        eq(articles.id, input.articleId),
        eq(feeds.workspaceId, input.workspaceId),
      ),
    )

  if (!article) throw new ServiceError("Article not found", 404)
  const patch = { read: input.read, starred: input.starred, saved: input.saved }

  if (Object.values(patch).every((value) => value === undefined)) return
  await db
    .insert(readingStates)
    .values({ userId, articleId: article.id, ...patch })
    .onConflictDoUpdate({
      target: [readingStates.articleId, readingStates.userId],
      set: patch,
    })
}
