import { pgTable, check, text, timestamp, boolean, unique, foreignKey, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const articles = pgTable("articles", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	content: text(),
	link: text().notNull(),
	imageUrl: text("image_url"),
	source: text().notNull(),
	pubDate: timestamp("pub_date", { mode: 'string' }).notNull(),
	isRead: boolean("is_read").default(false).notNull(),
	isReadLater: boolean("is_read_later").default(false).notNull(),
	isStarred: boolean("is_starred").default(false).notNull(),
	userId: text("user_id").notNull(),
	feedId: text("feed_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (_table) => [
	check("articles_id_not_null", sql`NOT NULL id`),
	check("articles_title_not_null", sql`NOT NULL title`),
	check("articles_description_not_null", sql`NOT NULL description`),
	check("articles_link_not_null", sql`NOT NULL link`),
	check("articles_source_not_null", sql`NOT NULL source`),
	check("articles_pub_date_not_null", sql`NOT NULL pub_date`),
	check("articles_user_id_not_null", sql`NOT NULL user_id`),
	check("articles_feed_id_not_null", sql`NOT NULL feed_id`),
	check("articles_is_read_not_null", sql`NOT NULL is_read`),
	check("articles_is_read_later_not_null", sql`NOT NULL is_read_later`),
	check("articles_is_starred_not_null", sql`NOT NULL is_starred`),
]);

export const feeds = pgTable("feeds", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	url: text().notNull(),
	description: text(),
	imageUrl: text("image_url"),
	lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow(),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("feed_user_url_unique").on(table.userId, table.url),
	check("feeds_id_not_null", sql`NOT NULL id`),
	check("feeds_title_not_null", sql`NOT NULL title`),
	check("feeds_url_not_null", sql`NOT NULL url`),
	check("feeds_user_id_not_null", sql`NOT NULL user_id`),
]);

export const tags = pgTable("tags", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (_table) => [
	check("tags_id_not_null", sql`NOT NULL id`),
	check("tags_name_not_null", sql`NOT NULL name`),
	check("tags_user_id_not_null", sql`NOT NULL user_id`),
]);

export const feedTags = pgTable("_feed_tags", {
	feedId: text("feed_id").notNull(),
	tagId: text("tag_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.feedId],
			foreignColumns: [feeds.id],
			name: "_feed_tags_feed_id_feeds_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tagId],
			foreignColumns: [tags.id],
			name: "_feed_tags_tag_id_tags_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.tagId, table.feedId], name: "_feed_tags_feed_id_tag_id_pk"}),
	check("_feed_tags_feed_id_not_null", sql`NOT NULL feed_id`),
	check("_feed_tags_tag_id_not_null", sql`NOT NULL tag_id`),
]);
