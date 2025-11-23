import { pgEnum } from "drizzle-orm/pg-core"

/**
 * Entity status enum for soft-delete functionality
 *
 * @property published - Entity is active and visible to users (default state)
 * @property draft - Entity is saved but not yet published (future feature)
 * @property deleted - Entity is soft-deleted and hidden from queries
 * @property expired - Entity has exceeded retention period and is hidden but preserved
 */
export const entityStatusEnum = pgEnum("entity_status", [
  "published",
  "draft",
  "deleted",
  "expired",
])
