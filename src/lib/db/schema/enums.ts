import { pgEnum } from "drizzle-orm/pg-core"

export const entityStatusEnum = pgEnum("entity_status", [
  "published",
  "draft",
  "deleted",
  "expired",
])

export const feedTypeEnum = pgEnum("feed_type", [
  "rss",
  "reddit",
  "google_news",
])
