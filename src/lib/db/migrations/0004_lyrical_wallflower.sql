ALTER TABLE "articles" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "feeds" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "article_feed_slug_unique" UNIQUE("feed_id","slug");--> statement-breakpoint
ALTER TABLE "feeds" ADD CONSTRAINT "feed_user_slug_unique" UNIQUE("user_id","slug");