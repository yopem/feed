CREATE TABLE "article_share_views" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"viewed_at" timestamp DEFAULT now() NOT NULL,
	"ip_hash" text,
	"referer" text,
	"user_agent" text,
	"country" text,
	"city" text
);
--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "is_publicly_shared" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "share_slug" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "share_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "share_password" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "share_view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "share_last_viewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "feeds" ADD COLUMN "is_bulk_shared" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "feeds" ADD COLUMN "bulk_share_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "article_share_views" ADD CONSTRAINT "article_share_views_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "article_share_view_article_idx" ON "article_share_views" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "article_share_view_viewed_at_idx" ON "article_share_views" USING btree ("viewed_at");--> statement-breakpoint
CREATE INDEX "article_share_view_country_idx" ON "article_share_views" USING btree ("country");--> statement-breakpoint
CREATE INDEX "article_share_slug_idx" ON "articles" USING btree ("share_slug");--> statement-breakpoint
CREATE INDEX "article_is_publicly_shared_idx" ON "articles" USING btree ("is_publicly_shared");--> statement-breakpoint
CREATE INDEX "article_share_expires_at_idx" ON "articles" USING btree ("share_expires_at");--> statement-breakpoint
CREATE INDEX "feed_is_bulk_shared_idx" ON "feeds" USING btree ("is_bulk_shared");--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "article_share_slug_unique" UNIQUE("share_slug");