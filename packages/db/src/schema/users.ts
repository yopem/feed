import { text, pgTable, uniqueIndex } from "drizzle-orm/pg-core"
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod"

export const users = pgTable(
  "users",
  {
    id: text().primaryKey(),
    issuer: text().notNull(),
    subjectId: text().notNull(),
    email: text().notNull(),
    name: text().notNull(),
  },
  (table) => [
    uniqueIndex("users_identity_idx").on(table.issuer, table.subjectId),
  ],
)

export const insertUserSchema = createInsertSchema(users)
export const updateUserSchema = createUpdateSchema(users)
export const userSchema = createSelectSchema(users)
export type SelectUser = typeof users.$inferSelect
export type InsertUser = typeof users.$inferInsert
