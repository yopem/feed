import { relations } from "drizzle-orm"
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createCustomId } from "@/lib/utils/custom-id"
import { entityStatusEnum } from "./enums"
import { feedTagsTable } from "./feed"

export const tagTable = pgTable(
  "tags",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createCustomId()),
    name: text("name").notNull(),
    description: text("description"),
    userId: text("user_id").notNull(),
    status: entityStatusEnum("status").notNull().default("published"),
    isFavorited: boolean("is_favorited").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [
    index("tag_status_idx").on(t.status),
    index("tag_user_status_idx").on(t.userId, t.status),
    index("tag_is_favorited_idx").on(t.isFavorited),
  ],
)

export const tagRelations = relations(tagTable, ({ many }) => ({
  feedTags: many(feedTagsTable),
}))

export const insertTagSchema = createInsertSchema(tagTable)
export const updateTagSchema = createUpdateSchema(tagTable)

export type SelectTag = typeof tagTable.$inferSelect
export type InsertTag = typeof tagTable.$inferInsert
