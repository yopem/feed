import { relations } from "drizzle-orm"
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createCustomId } from "@/lib/utils/custom-id"
import { entityStatusEnum } from "./enums"
import { feedTable } from "./feed"

export const articleTable = pgTable(
  "articles",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createCustomId()),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull(),
    content: text("content"),
    link: text("link").notNull(),
    imageUrl: text("image_url"),
    source: text("source").notNull(),
    pubDate: timestamp("pub_date").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    isReadLater: boolean("is_read_later").notNull().default(false),
    isFavorited: boolean("is_favorited").notNull().default(false),
    userId: text("user_id").notNull(),
    /** Username of article owner (denormalized for public share URLs) */
    username: text("username"),
    feedId: text("feed_id")
      .notNull()
      .references(() => feedTable.id, { onDelete: "cascade" }),
    /** Entity status for soft-delete: published (visible), draft (hidden), deleted (soft-deleted) */
    status: entityStatusEnum("status").notNull().default("published"),
    /** Whether the article is publicly shared via short URL */
    isPubliclyShared: boolean("is_publicly_shared").notNull().default(false),
    /** Custom short URL slug for public sharing (3-50 chars, alphanumeric + hyphens) */
    shareSlug: text("share_slug"),
    /** Expiration timestamp for public share link */
    shareExpiresAt: timestamp("share_expires_at"),
    /** Bcrypt-hashed password for password-protected shares */
    sharePassword: text("share_password"),
    /** Total view count for this shared article */
    shareViewCount: integer("share_view_count").notNull().default(0),
    /** Timestamp of last view for this shared article */
    shareLastViewedAt: timestamp("share_last_viewed_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [
    unique("article_feed_slug_unique").on(t.feedId, t.slug),
    unique("article_user_share_slug_unique").on(t.userId, t.shareSlug),
    index("article_status_idx").on(t.status),
    index("article_feed_status_idx").on(t.feedId, t.status),
    index("article_user_status_idx").on(t.userId, t.status),
    index("article_share_slug_idx").on(t.shareSlug),
    index("article_is_publicly_shared_idx").on(t.isPubliclyShared),
    index("article_share_expires_at_idx").on(t.shareExpiresAt),
  ],
)

/**
 * Article share view tracking table for analytics
 *
 * Tracks individual views of publicly shared articles including
 * timestamp, anonymized IP, referrer, user agent, and geographic data.
 * Used for generating share analytics and insights.
 */
export const articleShareViewTable = pgTable(
  "article_share_views",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createCustomId()),
    articleId: text("article_id")
      .notNull()
      .references(() => articleTable.id, { onDelete: "cascade" }),
    /** Timestamp when the article was viewed */
    viewedAt: timestamp("viewed_at").notNull().defaultNow(),
    /** SHA-256 hashed IP address for privacy-preserving analytics */
    ipHash: text("ip_hash"),
    /** HTTP Referer header (where the view came from) */
    referer: text("referer"),
    /** User agent string for device/browser detection */
    userAgent: text("user_agent"),
    /** Geographic country code (ISO 3166-1 alpha-2) */
    country: text("country"),
    /** Geographic city name */
    city: text("city"),
  },
  (t) => [
    index("article_share_view_article_idx").on(t.articleId),
    index("article_share_view_viewed_at_idx").on(t.viewedAt),
    index("article_share_view_country_idx").on(t.country),
  ],
)

export const articleRelations = relations(articleTable, ({ one, many }) => ({
  feed: one(feedTable, {
    fields: [articleTable.feedId],
    references: [feedTable.id],
  }),
  shareViews: many(articleShareViewTable),
}))

export const articleShareViewRelations = relations(
  articleShareViewTable,
  ({ one }) => ({
    article: one(articleTable, {
      fields: [articleShareViewTable.articleId],
      references: [articleTable.id],
    }),
  }),
)

export const insertArticleShareViewSchema = createInsertSchema(
  articleShareViewTable,
)
export const updateArticleShareViewSchema = createUpdateSchema(
  articleShareViewTable,
)

export const insertArticleSchema = createInsertSchema(articleTable)
export const updateArticleSchema = createUpdateSchema(articleTable)

export type SelectArticle = typeof articleTable.$inferSelect
export type InsertArticle = typeof articleTable.$inferInsert

export type SelectArticleShareView = typeof articleShareViewTable.$inferSelect
export type InsertArticleShareView = typeof articleShareViewTable.$inferInsert
