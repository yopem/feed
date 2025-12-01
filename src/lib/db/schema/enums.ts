import { pgEnum } from "drizzle-orm/pg-core"

/**
 * Entity status enum for soft-delete functionality
 *
 * @property published - Entity is active and visible to users (default state)
 * @property draft - Entity is saved but not yet published (future feature)
 * @property deleted - Entity is soft-deleted and hidden from queries
 * @property expired - Entity has exceeded retention period and is hidden but preserved
 */
export const entityStatusEnum = pgEnum("entity_status", [
  "published",
  "draft",
  "deleted",
  "expired",
])

/**
 * Feed type enum to distinguish content sources
 *
 * @property rss - Traditional RSS/Atom feed (default)
 * @property reddit - Reddit subreddit feed via JSON API
 * @property google_news - Google News RSS feed (topics or search queries)
 */
export const feedTypeEnum = pgEnum("feed_type", [
  "rss",
  "reddit",
  "google_news",
])
