import { relations } from "drizzle-orm"
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createCustomId } from "@/lib/utils/custom-id"
import { feedTable } from "./feed"

export const articleTable = pgTable("articles", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createCustomId()),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content"),
  link: text("link").notNull(),
  imageUrl: text("image_url"),
  source: text("source").notNull(),
  pubDate: timestamp("pub_date").notNull(),
  isRead: boolean("is_read").default(false),
  isReadLater: boolean("is_read_later").default(false),
  isStarred: boolean("is_starred").default(false),
  userId: text("user_id").notNull(),
  feedId: text("feed_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const articleRelations = relations(articleTable, ({ one }) => ({
  feed: one(feedTable, {
    fields: [articleTable.feedId],
    references: [feedTable.id],
  }),
}))

export const insertArticleSchema = createInsertSchema(articleTable)
export const updateArticleSchema = createUpdateSchema(articleTable)

export type SelectArticle = typeof articleTable.$inferSelect
export type InsertArticle = typeof articleTable.$inferInsert
