CREATE TABLE "articles" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"content" text,
	"link" text NOT NULL,
	"image_url" text,
	"source" text NOT NULL,
	"pub_date" timestamp NOT NULL,
	"is_read" boolean DEFAULT false,
	"is_read_later" boolean DEFAULT false,
	"is_starred" boolean DEFAULT false,
	"user_id" text NOT NULL,
	"feed_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feeds" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"image_url" text,
	"last_updated" timestamp DEFAULT now(),
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "_feed_tags" (
	"feed_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "_feed_tags_feed_id_tag_id_pk" PRIMARY KEY("feed_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "_feed_tags" ADD CONSTRAINT "_feed_tags_feed_id_feeds_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."feeds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "_feed_tags" ADD CONSTRAINT "_feed_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;