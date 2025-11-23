ALTER TYPE "public"."entity_status" ADD VALUE 'expired';--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "article_retention_days" integer DEFAULT 30 NOT NULL;