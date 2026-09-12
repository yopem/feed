import {
  boolean,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod"

import { feeds } from "db/schema/feeds"
import { users } from "db/schema/users"

export const articles = pgTable(
  "articles",
  {
    id: text().primaryKey(),
    feedId: text()
      .notNull()
      .references(() => feeds.id, { onDelete: "cascade" }),
    guid: text().notNull(),
    title: text().notNull(),
    url: text().notNull(),
    content: text().notNull(),
    publishedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("articles_feed_guid").on(table.feedId, table.guid),
    index("articles_published").on(table.publishedAt),
  ],
)

export const insertArticleSchema = createInsertSchema(articles)
export const updateArticleSchema = createUpdateSchema(articles)
export const articleSchema = createSelectSchema(articles)
export type SelectArticle = typeof articles.$inferSelect
export type InsertArticle = typeof articles.$inferInsert

export const readingStates = pgTable(
  "reading_states",
  {
    articleId: text()
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    read: boolean().notNull().default(false),
    starred: boolean().notNull().default(false),
    saved: boolean().notNull().default(false),
  },
  (table) => [primaryKey({ columns: [table.articleId, table.userId] })],
)

export const insertReadingStateSchema = createInsertSchema(readingStates)
export const updateReadingStateSchema = createUpdateSchema(readingStates)
export const readingStateSchema = createSelectSchema(readingStates)
export type SelectReadingState = typeof readingStates.$inferSelect
export type InsertReadingState = typeof readingStates.$inferInsert
