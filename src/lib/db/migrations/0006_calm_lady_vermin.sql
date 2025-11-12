CREATE TABLE "user_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"auto_refresh_enabled" boolean DEFAULT true NOT NULL,
	"refresh_interval_hours" integer DEFAULT 24 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "feeds" ADD COLUMN "last_refreshed_at" timestamp;