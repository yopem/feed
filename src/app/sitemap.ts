import type { MetadataRoute } from "next"

import { env } from "@/lib/env"

/**
 * Generates the site sitemap
 *
 * Currently includes only the homepage. Articles are only accessible
 * to authenticated users in their dashboard and are not publicly indexed.
 *
 * @returns Sitemap entries with URLs, last modified dates, and priorities
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
  ]
}
