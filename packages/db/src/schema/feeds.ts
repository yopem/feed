import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core"
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod"

import { workspaces } from "db/schema/workspaces"

export const feeds = pgTable(
  "feeds",
  {
    id: text().primaryKey(),
    workspaceId: text()
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    title: text().notNull(),
    url: text().notNull(),
    lastFetchedAt: timestamp({ withTimezone: true }),
    error: text(),
  },
  (table) => [
    uniqueIndex("feeds_workspace_url").on(table.workspaceId, table.url),
  ],
)

export const insertFeedSchema = createInsertSchema(feeds)

export const updateFeedSchema = createUpdateSchema(feeds)

export const feedSchema = createSelectSchema(feeds)

export type SelectFeed = typeof feeds.$inferSelect

export type InsertFeed = typeof feeds.$inferInsert
