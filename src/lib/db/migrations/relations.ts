import { relations } from "drizzle-orm/relations";
import { feeds, feedTags, tags } from "./schema";

export const feedTagsRelations = relations(feedTags, ({one}) => ({
	feed: one(feeds, {
		fields: [feedTags.feedId],
		references: [feeds.id]
	}),
	tag: one(tags, {
		fields: [feedTags.tagId],
		references: [tags.id]
	}),
}));

export const feedsRelations = relations(feeds, ({many}) => ({
	feedTags: many(feedTags),
}));

export const tagsRelations = relations(tags, ({many}) => ({
	feedTags: many(feedTags),
}));