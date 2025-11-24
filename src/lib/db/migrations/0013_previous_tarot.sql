CREATE TYPE "public"."feed_type" AS ENUM('rss', 'reddit');--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "reddit_post_id" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "reddit_permalink" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "reddit_subreddit" text;--> statement-breakpoint
ALTER TABLE "feeds" ADD COLUMN "feed_type" "feed_type" DEFAULT 'rss' NOT NULL;--> statement-breakpoint
CREATE INDEX "article_reddit_post_id_idx" ON "articles" USING btree ("reddit_post_id");--> statement-breakpoint
CREATE INDEX "feed_type_idx" ON "feeds" USING btree ("feed_type");