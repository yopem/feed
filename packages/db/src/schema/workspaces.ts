import { pgEnum, pgTable, primaryKey, text } from "drizzle-orm/pg-core"
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod"

import { users } from "db/schema/users"

export const role = pgEnum("workspace_role", ["owner", "editor", "viewer"])

export const workspaces = pgTable("workspaces", {
  id: text().primaryKey(),
  name: text().notNull(),
})

export const insertWorkspaceSchema = createInsertSchema(workspaces)

export const updateWorkspaceSchema = createUpdateSchema(workspaces)

export const workspaceSchema = createSelectSchema(workspaces)

export type SelectWorkspace = typeof workspaces.$inferSelect

export type InsertWorkspace = typeof workspaces.$inferInsert

export const memberships = pgTable(
  "memberships",
  {
    workspaceId: text()
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: role().notNull(),
  },
  (table) => [primaryKey({ columns: [table.workspaceId, table.userId] })],
)

export const insertMembershipSchema = createInsertSchema(memberships)

export const updateMembershipSchema = createUpdateSchema(memberships)

export const membershipSchema = createSelectSchema(memberships)

export type SelectMembership = typeof memberships.$inferSelect

export type InsertMembership = typeof memberships.$inferInsert
