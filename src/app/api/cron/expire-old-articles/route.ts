/* eslint-disable no-restricted-properties */

import { NextResponse } from "next/server"
import { and, eq, lt } from "drizzle-orm"

import { db } from "@/lib/db"
import { articleTable } from "@/lib/db/schema"

export async function GET(request: Request) {
  try {
    const cronSecret = process.env["CRON_SECRET"]

    if (cronSecret) {
      const authHeader = request.headers.get("authorization")
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const now = new Date()
    let usersProcessed = 0
    let totalArticlesExpired = 0

    const allUserSettings = await db.query.userSettingsTable.findMany({
      columns: {
        userId: true,
        articleRetentionDays: true,
      },
    })

    for (const settings of allUserSettings) {
      const retentionDays = settings.articleRetentionDays
      const expirationDate = new Date(now)
      expirationDate.setDate(expirationDate.getDate() - retentionDays)

      const expiredArticles = await db
        .update(articleTable)
        .set({
          status: "expired",
          updatedAt: now,
        })
        .where(
          and(
            eq(articleTable.userId, settings.userId),
            eq(articleTable.status, "published"),
            lt(articleTable.createdAt, expirationDate),
          ),
        )
        .returning({ id: articleTable.id })

      totalArticlesExpired += expiredArticles.length
      usersProcessed++
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      expired: {
        usersProcessed,
        articlesExpired: totalArticlesExpired,
      },
    })
  } catch (error) {
    console.error("Error expiring old articles:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
