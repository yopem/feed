DO $$ BEGIN
 CREATE TYPE "public"."feed_type" AS ENUM('rss', 'reddit');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "articles" ADD COLUMN "reddit_post_id" text;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "articles" ADD COLUMN "reddit_permalink" text;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "articles" ADD COLUMN "reddit_subreddit" text;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feeds" ADD COLUMN "feed_type" "feed_type" DEFAULT 'rss' NOT NULL;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "article_reddit_post_id_idx" ON "articles" USING btree ("reddit_post_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feed_type_idx" ON "feeds" USING btree ("feed_type");