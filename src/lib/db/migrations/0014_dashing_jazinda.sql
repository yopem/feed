ALTER TABLE "article_share_views" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "article_share_views" CASCADE;--> statement-breakpoint
ALTER TABLE "articles" DROP CONSTRAINT "article_user_share_slug_unique";--> statement-breakpoint
DROP INDEX "article_share_slug_idx";--> statement-breakpoint
DROP INDEX "article_is_publicly_shared_idx";--> statement-breakpoint
DROP INDEX "article_share_expires_at_idx";--> statement-breakpoint
DROP INDEX "feed_is_bulk_shared_idx";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "username";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "is_publicly_shared";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "share_slug";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "share_expires_at";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "share_password";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "share_view_count";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "share_last_viewed_at";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN "is_bulk_shared";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN "bulk_share_expires_at";