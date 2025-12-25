import { relations } from "drizzle-orm"
import {
  boolean,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createCustomId } from "@/lib/utils/custom-id"
import { articleTable } from "./article"
import { entityStatusEnum, feedTypeEnum } from "./enums"
import { tagTable } from "./tag"

export const feedTable = pgTable(
  "feeds",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createCustomId()),
    title: text("title").notNull(),
    url: text("url").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    lastUpdated: timestamp("last_updated").defaultNow(),
    lastRefreshedAt: timestamp("last_refreshed_at"),
    userId: text("user_id").notNull(),
    feedType: feedTypeEnum("feed_type").notNull().default("rss"),
    status: entityStatusEnum("status").notNull().default("published"),
    isFavorited: boolean("is_favorited").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    unique("feed_user_url_unique").on(t.userId, t.url),
    unique("feed_user_slug_unique").on(t.userId, t.slug),
    index("feed_status_idx").on(t.status),
    index("feed_user_status_idx").on(t.userId, t.status),
    index("feed_type_idx").on(t.feedType),
    index("feed_is_favorited_idx").on(t.isFavorited),
  ],
)

export const feedRelations = relations(feedTable, ({ many }) => ({
  articles: many(articleTable),
  tags: many(feedTagsTable),
}))

export const feedTagsTable = pgTable(
  "_feed_tags",
  {
    feedId: text("feed_id")
      .notNull()
      .references(() => feedTable.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tagTable.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({
      columns: [t.feedId, t.tagId],
    }),
  ],
)

export const feedTagsRelations = relations(feedTagsTable, ({ one }) => ({
  feed: one(feedTable, {
    fields: [feedTagsTable.feedId],
    references: [feedTable.id],
  }),
  tag: one(tagTable, {
    fields: [feedTagsTable.tagId],
    references: [tagTable.id],
  }),
}))

export const insertFeedSchema = createInsertSchema(feedTable)
export const updateFeedSchema = createUpdateSchema(feedTable)

export type SelectFeed = typeof feedTable.$inferSelect
export type SelectFeedWithRelations = SelectFeed & {
  tags: { id: string | null; title: string | null; slug: string | null }[]
}
export type InsertFeed = typeof feedTable.$inferInsert
