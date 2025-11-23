ALTER TABLE "articles" RENAME COLUMN "is_starred" TO "is_favorited";--> statement-breakpoint
ALTER TABLE "feeds" RENAME COLUMN "is_starred" TO "is_favorited";--> statement-breakpoint
ALTER TABLE "tags" RENAME COLUMN "is_starred" TO "is_favorited";--> statement-breakpoint
DROP INDEX "feed_is_starred_idx";--> statement-breakpoint
DROP INDEX "tag_is_starred_idx";--> statement-breakpoint
CREATE INDEX "feed_is_favorited_idx" ON "feeds" USING btree ("is_favorited");--> statement-breakpoint
CREATE INDEX "tag_is_favorited_idx" ON "tags" USING btree ("is_favorited");