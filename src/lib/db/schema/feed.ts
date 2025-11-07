import { relations } from "drizzle-orm"
import {
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
import { entityStatusEnum } from "./enums"
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
    userId: text("user_id").notNull(),
    /** Entity status for soft-delete: published (visible), draft (hidden), deleted (soft-deleted) */
    status: entityStatusEnum("status").notNull().default("published"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [
    unique("feed_user_url_unique").on(t.userId, t.url),
    unique("feed_user_slug_unique").on(t.userId, t.slug),
    index("feed_status_idx").on(t.status),
    index("feed_user_status_idx").on(t.userId, t.status),
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
