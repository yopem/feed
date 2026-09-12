import { and, eq, sql } from "drizzle-orm"

import { db } from "db/index"
import { articles } from "db/schema/articles"
import { feeds } from "db/schema/feeds"
import { requireMembership, ServiceError } from "db/services/access"
import { createId } from "utils/id"

export async function listFeeds(userId: string, workspaceId: string) {
  await requireMembership(userId, workspaceId)
  return db.select().from(feeds).where(eq(feeds.workspaceId, workspaceId))
}

export async function getFeed(
  userId: string,
  workspaceId: string,
  feedId: string,
) {
  await requireMembership(userId, workspaceId, true)
  const [feed] = await db
    .select()
    .from(feeds)
    .where(and(eq(feeds.workspaceId, workspaceId), eq(feeds.id, feedId)))
  if (!feed) throw new ServiceError("Feed not found", 404)
  return feed
}

export async function addFeed(
  userId: string,
  workspaceId: string,
  url: string,
) {
  await requireMembership(userId, workspaceId, true)
  const [feed] = await db
    .insert(feeds)
    .values({ id: createId(), workspaceId, url, title: url })
    .onConflictDoUpdate({
      target: [feeds.workspaceId, feeds.url],
      set: { url },
    })
    .returning()
  if (!feed) throw new Error("Feed creation failed")
  return feed
}

export async function removeFeed(
  userId: string,
  workspaceId: string,
  feedId: string,
) {
  await getFeed(userId, workspaceId, feedId)
  await db
    .delete(feeds)
    .where(and(eq(feeds.id, feedId), eq(feeds.workspaceId, workspaceId)))
}

export function pollingFeeds() {
  return db.select().from(feeds)
}

export async function refreshStoredFeed(
  feed: typeof feeds.$inferSelect,
  fetcher: (url: string) => Promise<{
    title: string
    articles: {
      guid: string
      title: string
      url: string
      content: string
      publishedAt: Date | null
    }[]
  }>,
) {
  await db.transaction(async (tx) => {
    const [locked] = await tx
      .select()
      .from(feeds)
      .where(eq(feeds.id, feed.id))
      .for("update", { skipLocked: true })
    if (!locked) return
    let result
    try {
      result = await fetcher(locked.url)
    } catch {
      await tx
        .update(feeds)
        .set({ error: "Feed refresh failed", lastFetchedAt: new Date() })
        .where(eq(feeds.id, locked.id))
      return
    }
    if (result.articles.length) {
      await tx
        .insert(articles)
        .values(
          result.articles.map((article) => ({
            ...article,
            id: createId(),
            feedId: locked.id,
          })),
        )
        .onConflictDoUpdate({
          target: [articles.feedId, articles.guid],
          set: {
            title: sql`excluded.title`,
            content: sql`excluded.content`,
            url: sql`excluded.url`,
            publishedAt: sql`excluded.published_at`,
          },
        })
    }
    await tx
      .update(feeds)
      .set({ title: result.title, lastFetchedAt: new Date(), error: null })
      .where(eq(feeds.id, locked.id))
  })
}
