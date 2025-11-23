ALTER TABLE "feeds" ADD COLUMN "is_starred" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "is_starred" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "feed_is_starred_idx" ON "feeds" USING btree ("is_starred");--> statement-breakpoint
CREATE INDEX "tag_is_starred_idx" ON "tags" USING btree ("is_starred");