import { relations } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createCustomId } from "@/lib/utils/custom-id"
import { feedTagsTable } from "./feed"

export const tagTable = pgTable("tags", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createCustomId()),
  name: text("name").notNull(),
  description: text("description"),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const tagRelations = relations(tagTable, ({ many }) => ({
  feedTags: many(feedTagsTable),
}))

export const insertTagSchema = createInsertSchema(tagTable)
export const updateTagSchema = createUpdateSchema(tagTable)

export type SelectTag = typeof tagTable.$inferSelect
export type InsertTag = typeof tagTable.$inferInsert
