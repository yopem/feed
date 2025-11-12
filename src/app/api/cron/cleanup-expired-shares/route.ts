/* eslint-disable no-restricted-properties */

import { NextResponse } from "next/server"
import { eq, lt } from "drizzle-orm"

import { db } from "@/lib/db"
import { articleTable, feedTable } from "@/lib/db/schema"

/**
 * Cron job endpoint to clean up expired shares
 *
 * This endpoint should be called periodically (e.g., every hour) by a cron service
 * to disable sharing for articles and feeds that have passed their expiration date.
 *
 * Security: Protected by CRON_SECRET environment variable (if set)
 *
 * @returns Statistics about cleaned up shares
 */
export async function GET(request: Request) {
  try {
    // Verify authorization if CRON_SECRET is set
    const cronSecret = process.env["CRON_SECRET"]

    if (cronSecret) {
      const authHeader = request.headers.get("authorization")
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const now = new Date()
    let cleanedArticles = 0
    let cleanedFeeds = 0
    let cleanedBulkArticles = 0

    // Clean up expired individual article shares
    const expiredArticles = await db
      .update(articleTable)
      .set({
        isPubliclyShared: false,
        shareExpiresAt: null,
      })
      .where(lt(articleTable.shareExpiresAt, now))
      .returning({ id: articleTable.id })

    cleanedArticles = expiredArticles.length

    // Clean up expired bulk feed shares
    const expiredFeeds = await db.query.feedTable.findMany({
      where: lt(feedTable.bulkShareExpiresAt, now),
      columns: {
        id: true,
      },
    })

    if (expiredFeeds.length > 0) {
      cleanedFeeds = expiredFeeds.length

      // Disable bulk sharing on expired feeds
      await db
        .update(feedTable)
        .set({
          isBulkShared: false,
          bulkShareExpiresAt: null,
        })
        .where(lt(feedTable.bulkShareExpiresAt, now))

      // Disable public sharing for all articles in expired bulk-shared feeds
      for (const feed of expiredFeeds) {
        const result = await db
          .update(articleTable)
          .set({
            isPubliclyShared: false,
          })
          .where(eq(articleTable.feedId, feed.id))
          .returning({ id: articleTable.id })

        cleanedBulkArticles += result.length
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      cleaned: {
        articles: cleanedArticles,
        feeds: cleanedFeeds,
        bulkArticles: cleanedBulkArticles,
        total: cleanedArticles + cleanedBulkArticles,
      },
    })
  } catch (error) {
    console.error("Error cleaning up expired shares:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
