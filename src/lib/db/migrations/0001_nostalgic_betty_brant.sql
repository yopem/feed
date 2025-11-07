-- Delete orphaned articles where feed_id doesn't exist in feeds table
DELETE FROM "articles" 
WHERE "feed_id" NOT IN (SELECT "id" FROM "feeds");

-- Add foreign key constraint with cascade delete
ALTER TABLE "articles" ADD CONSTRAINT "articles_feed_id_feeds_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."feeds"("id") ON DELETE cascade ON UPDATE no action;