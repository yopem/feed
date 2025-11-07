import { nanoid } from "nanoid"

import {
  articleTable,
  feedTable,
  feedTagsTable,
  tagTable,
  type InsertArticle,
  type InsertFeed,
  type InsertTag,
} from "@/lib/db/schema"
import { getTestDb } from "./db"

/**
 * Factory for creating test users
 * Returns a mock user ID for use in tests
 */
export function createTestUser(overrides?: { id?: string }): string {
  return overrides?.id ?? `user_${nanoid(10)}`
}

/**
 * Factory for creating test feeds
 * Creates a feed in the database with sensible defaults
 *
 * @example
 * const feed = await createTestFeed({ userId: 'user_123' })
 */
export async function createTestFeed(
  overrides?: Partial<InsertFeed>,
): Promise<InsertFeed & { id: string }> {
  const db = getTestDb()
  const userId = overrides?.userId ?? createTestUser()

  const feedData: InsertFeed = {
    title: overrides?.title ?? `Test Feed ${nanoid(6)}`,
    url: overrides?.url ?? `https://example.com/feed-${nanoid(6)}.xml`,
    slug: overrides?.slug ?? `test-feed-${nanoid(6)}`,
    description: overrides?.description ?? "A test feed description",
    imageUrl: overrides?.imageUrl ?? "https://example.com/image.png",
    userId,
    status: overrides?.status ?? "published",
    ...overrides,
  }

  const [feed] = await db.insert(feedTable).values(feedData).returning()
  return feed!
}

/**
 * Factory for creating test articles
 * Creates an article in the database with sensible defaults
 *
 * @example
 * const article = await createTestArticle({ feedId: feed.id, userId: 'user_123' })
 */
export async function createTestArticle(
  overrides?: Partial<InsertArticle>,
): Promise<InsertArticle & { id: string }> {
  const db = getTestDb()
  const userId = overrides?.userId ?? createTestUser()

  let feedId = overrides?.feedId
  if (!feedId) {
    const feed = await createTestFeed({ userId })
    feedId = feed.id
  }

  const articleData: InsertArticle = {
    title: overrides?.title ?? `Test Article ${nanoid(6)}`,
    slug: overrides?.slug ?? `test-article-${nanoid(6)}`,
    description: overrides?.description ?? "A test article description",
    content: overrides?.content ?? "<p>Test article content</p>",
    link: overrides?.link ?? `https://example.com/article-${nanoid(6)}`,
    imageUrl: overrides?.imageUrl ?? "https://example.com/article-image.png",
    source: overrides?.source ?? "Test Source",
    pubDate: overrides?.pubDate ?? new Date(),
    isRead: overrides?.isRead ?? false,
    isReadLater: overrides?.isReadLater ?? false,
    isStarred: overrides?.isStarred ?? false,
    userId,
    feedId,
    status: overrides?.status ?? "published",
    ...overrides,
  }

  const [article] = await db
    .insert(articleTable)
    .values(articleData)
    .returning()
  return article!
}

/**
 * Factory for creating test tags
 * Creates a tag in the database with sensible defaults
 *
 * @example
 * const tag = await createTestTag({ userId: 'user_123' })
 */
export async function createTestTag(
  overrides?: Partial<InsertTag>,
): Promise<InsertTag & { id: string }> {
  const db = getTestDb()
  const userId = overrides?.userId ?? createTestUser()

  const tagData: InsertTag = {
    name: overrides?.name ?? `Test Tag ${nanoid(6)}`,
    description: overrides?.description ?? "A test tag description",
    userId,
    status: overrides?.status ?? "published",
    ...overrides,
  }

  const [tag] = await db.insert(tagTable).values(tagData).returning()
  return tag!
}

/**
 * Associate a feed with a tag
 *
 * @example
 * await associateFeedTag({ feedId: feed.id, tagId: tag.id })
 */
export async function associateFeedTag({
  feedId,
  tagId,
}: {
  feedId: string
  tagId: string
}): Promise<void> {
  const db = getTestDb()
  await db.insert(feedTagsTable).values({ feedId, tagId })
}

/**
 * Create multiple test feeds at once
 *
 * @example
 * const feeds = await createTestFeeds(3, { userId: 'user_123' })
 */
export async function createTestFeeds(
  count: number,
  overrides?: Partial<InsertFeed>,
): Promise<Array<InsertFeed & { id: string }>> {
  const feeds: Array<InsertFeed & { id: string }> = []

  for (let i = 0; i < count; i++) {
    const feed = await createTestFeed(overrides)
    feeds.push(feed)
  }

  return feeds
}

/**
 * Create multiple test articles at once
 *
 * @example
 * const articles = await createTestArticles(5, { feedId: feed.id, userId: 'user_123' })
 */
export async function createTestArticles(
  count: number,
  overrides?: Partial<InsertArticle>,
): Promise<Array<InsertArticle & { id: string }>> {
  const articles: Array<InsertArticle & { id: string }> = []

  for (let i = 0; i < count; i++) {
    const article = await createTestArticle(overrides)
    articles.push(article)
  }

  return articles
}
