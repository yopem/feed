-- Rename is_starred columns to is_favorited across all tables
ALTER TABLE "articles" RENAME COLUMN "is_starred" TO "is_favorited";--> statement-breakpoint
ALTER TABLE "feeds" RENAME COLUMN "is_starred" TO "is_favorited";--> statement-breakpoint
ALTER TABLE "tags" RENAME COLUMN "is_starred" TO "is_favorited";--> statement-breakpoint

-- Drop old indexes
DROP INDEX IF EXISTS "feed_is_starred_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "tag_is_starred_idx";--> statement-breakpoint

-- Create new indexes with updated names
CREATE INDEX "feed_is_favorited_idx" ON "feeds" USING btree ("is_favorited");--> statement-breakpoint
CREATE INDEX "tag_is_favorited_idx" ON "tags" USING btree ("is_favorited");
