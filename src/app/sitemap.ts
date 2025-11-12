import type { MetadataRoute } from "next"
import { eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { articleTable } from "@/lib/db/schema"
import { env } from "@/lib/env"

/**
 * Generates dynamic sitemap including all publicly shared articles
 *
 * Creates sitemap entries for the homepage and all articles that are
 * publicly shared and not expired. Uses article username and share slug
 * to construct canonical URLs.
 *
 * @returns Sitemap entries with URLs, last modified dates, and priorities
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL

  const now = new Date()

  const sharedArticles = await db.query.articleTable.findMany({
    where: eq(articleTable.isPubliclyShared, true),
    columns: {
      username: true,
      shareSlug: true,
      updatedAt: true,
      shareExpiresAt: true,
    },
  })

  const validArticles = sharedArticles.filter((article) => {
    if (!article.username || !article.shareSlug) return false
    if (article.shareExpiresAt && article.shareExpiresAt < now) return false
    return true
  })

  const articleEntries: MetadataRoute.Sitemap = validArticles.map(
    (article) => ({
      url: `${baseUrl}/s/${article.shareSlug}`,
      lastModified: article.updatedAt ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }),
  )

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...articleEntries,
  ]
}
