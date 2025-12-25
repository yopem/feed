import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createCustomId } from "@/lib/utils/custom-id"

export const userSettingsTable = pgTable("user_settings", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createCustomId()),
  userId: text("user_id").notNull().unique(),
  autoRefreshEnabled: boolean("auto_refresh_enabled").default(true).notNull(),
  refreshIntervalHours: integer("refresh_interval_hours").default(24).notNull(),
  articleRetentionDays: integer("article_retention_days").default(30).notNull(),
  showFilterCountBadges: boolean("show_filter_count_badges")
    .default(true)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const insertUserSettingsSchema = createInsertSchema(userSettingsTable)
export const updateUserSettingsSchema = createUpdateSchema(userSettingsTable)

export type SelectUserSettings = typeof userSettingsTable.$inferSelect
export type InsertUserSettings = typeof userSettingsTable.$inferInsert
