#!/usr/bin/env bun
/**
 * Data migration script to populate slug fields for existing feeds and articles
 * Run this after applying migration 0004_lyrical_wallflower.sql
 */

/* eslint-disable no-console */
/* eslint-disable no-restricted-properties */
/* eslint-disable @typescript-eslint/no-floating-promises */

import { drizzle } from "drizzle-orm/node-postgres"
import { eq, sql } from "drizzle-orm"
import { pgTable, text } from "drizzle-orm/pg-core"
import { slugify } from "@/lib/utils/slug"

// Standalone table definitions (avoid importing from schema to prevent server-only issues)
const feedTable = pgTable("feeds", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  slug: text("slug"),
  userId: text("user_id").notNull(),
})

const articleTable = pgTable("articles", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug"),
  feedId: text("feed_id").notNull(),
})

// Create standalone db connection
const db = drizzle(process.env["DATABASE_URL"]!)

async function populateFeedSlugs() {
  console.log("🔄 Populating feed slugs...")

  // Get all feeds without slugs
  const feeds = await db
    .select()
    .from(feedTable)
    .where(sql`${feedTable.slug} IS NULL`)

  console.log(`Found ${feeds.length} feeds without slugs`)

  // Group feeds by userId to track slug uniqueness per user
  const feedsByUser = new Map<string, typeof feeds>()
  for (const feed of feeds) {
    if (!feedsByUser.has(feed.userId)) {
      feedsByUser.set(feed.userId, [])
    }
    feedsByUser.get(feed.userId)!.push(feed)
  }

  let updatedCount = 0

  // Process each user's feeds
  for (const [userId, userFeeds] of feedsByUser.entries()) {
    const usedSlugs = new Set<string>()

    // Get existing slugs for this user
    const existingSlugs = await db
      .select({ slug: feedTable.slug })
      .from(feedTable)
      .where(
        sql`${feedTable.userId} = ${userId} AND ${feedTable.slug} IS NOT NULL`,
      )

    existingSlugs.forEach((row) => {
      if (row.slug) usedSlugs.add(row.slug)
    })

    // Generate unique slugs for each feed
    for (const feed of userFeeds) {
      let baseSlug = slugify(feed.title)
      if (!baseSlug) {
        baseSlug = `feed-${feed.id.slice(0, 8)}`
      }

      let slug = baseSlug
      let counter = 2

      // Ensure uniqueness by appending counter if needed
      while (usedSlugs.has(slug)) {
        slug = `${baseSlug}-${counter}`
        counter++
      }

      usedSlugs.add(slug)

      // Update the feed with the new slug
      await db.update(feedTable).set({ slug }).where(eq(feedTable.id, feed.id))

      updatedCount++
      console.log(`  ✓ Updated feed "${feed.title}" -> "${slug}"`)
    }
  }

  console.log(`✅ Updated ${updatedCount} feed slugs\n`)
}

async function populateArticleSlugs() {
  console.log("🔄 Populating article slugs...")

  // Get all articles without slugs
  const articles = await db
    .select()
    .from(articleTable)
    .where(sql`${articleTable.slug} IS NULL`)

  console.log(`Found ${articles.length} articles without slugs`)

  // Group articles by feedId to track slug uniqueness per feed
  const articlesByFeed = new Map<string, typeof articles>()
  for (const article of articles) {
    if (!articlesByFeed.has(article.feedId)) {
      articlesByFeed.set(article.feedId, [])
    }
    articlesByFeed.get(article.feedId)!.push(article)
  }

  let updatedCount = 0

  // Process each feed's articles
  for (const [feedId, feedArticles] of articlesByFeed.entries()) {
    const usedSlugs = new Set<string>()

    // Get existing slugs for this feed
    const existingSlugs = await db
      .select({ slug: articleTable.slug })
      .from(articleTable)
      .where(
        sql`${articleTable.feedId} = ${feedId} AND ${articleTable.slug} IS NOT NULL`,
      )

    existingSlugs.forEach((row) => {
      if (row.slug) usedSlugs.add(row.slug)
    })

    // Generate unique slugs for each article
    for (const article of feedArticles) {
      let baseSlug = slugify(article.title)
      if (!baseSlug) {
        baseSlug = `article-${article.id.slice(0, 8)}`
      }

      let slug = baseSlug
      let counter = 2

      // Ensure uniqueness by appending counter if needed
      while (usedSlugs.has(slug)) {
        slug = `${baseSlug}-${counter}`
        counter++
      }

      usedSlugs.add(slug)

      // Update the article with the new slug
      await db
        .update(articleTable)
        .set({ slug })
        .where(eq(articleTable.id, article.id))

      updatedCount++
      if (updatedCount % 100 === 0) {
        console.log(`  ... processed ${updatedCount} articles`)
      }
    }
  }

  console.log(`✅ Updated ${updatedCount} article slugs\n`)
}

async function main() {
  try {
    console.log("🚀 Starting slug population migration...\n")

    await populateFeedSlugs()
    await populateArticleSlugs()

    console.log("✨ Migration completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Migration failed:", error)
    process.exit(1)
  }
}

main()
