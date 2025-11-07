ALTER TABLE "_feed_tags" DROP CONSTRAINT "_feed_tags_feed_id_feeds_id_fk";
--> statement-breakpoint
ALTER TABLE "_feed_tags" DROP CONSTRAINT "_feed_tags_tag_id_tags_id_fk";
--> statement-breakpoint
ALTER TABLE "_feed_tags" ADD CONSTRAINT "_feed_tags_feed_id_feeds_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."feeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "_feed_tags" ADD CONSTRAINT "_feed_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;