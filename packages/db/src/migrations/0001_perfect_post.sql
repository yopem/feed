ALTER TABLE "auth_storage" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "auth_storage" CASCADE;--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_googleId_unique";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "issuer" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subject_id" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_identity_idx" ON "users" USING btree ("issuer","subject_id");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "google_id";