CREATE TYPE "public"."entity_status" AS ENUM('published', 'draft', 'deleted');--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "status" "entity_status" DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "feeds" ADD COLUMN "status" "entity_status" DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "status" "entity_status" DEFAULT 'published' NOT NULL;--> statement-breakpoint
CREATE INDEX "article_status_idx" ON "articles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "article_feed_status_idx" ON "articles" USING btree ("feed_id","status");--> statement-breakpoint
CREATE INDEX "article_user_status_idx" ON "articles" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "feed_status_idx" ON "feeds" USING btree ("status");--> statement-breakpoint
CREATE INDEX "feed_user_status_idx" ON "feeds" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "tag_status_idx" ON "tags" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tag_user_status_idx" ON "tags" USING btree ("user_id","status");