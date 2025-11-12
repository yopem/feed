ALTER TABLE "articles" DROP CONSTRAINT "article_share_slug_unique";--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "article_user_share_slug_unique" UNIQUE("user_id","share_slug");