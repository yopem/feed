import type { Metadata } from "next"
import { and, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { articleTable } from "@/lib/db/schema"
import { env } from "@/lib/env"
import { stripHtml } from "@/lib/utils/html"

interface ShareLayoutProps {
  children: React.ReactNode
  params: Promise<{ username: string; slug: string }>
}

/**
 * Generates SEO metadata for shared articles
 *
 * Includes OpenGraph tags, Twitter cards, and JSON-LD structured data
 * for optimal social media and search engine visibility
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; slug: string }>
}): Promise<Metadata> {
  const { username, slug } = await params

  try {
    const article = await db.query.articleTable.findFirst({
      where: and(
        eq(articleTable.username, username),
        eq(articleTable.shareSlug, slug),
        eq(articleTable.isPubliclyShared, true),
      ),
      with: {
        feed: {
          columns: {
            title: true,
            imageUrl: true,
          },
        },
      },
    })

    if (!article) {
      return {
        title: "Article Not Found",
        description: "This shared article doesn't exist or has expired",
      }
    }

    const isExpired =
      article.shareExpiresAt && new Date(article.shareExpiresAt) < new Date()

    if (isExpired) {
      return {
        title: "Link Expired",
        description: "This shared article link has expired",
      }
    }

    const title = article.title
    const description = article.description
      ? stripHtml(article.description).slice(0, 160)
      : `Shared article from ${article.feed.title}`
    const imageUrl = article.imageUrl ?? article.feed.imageUrl
    const url = `${env.NEXT_PUBLIC_SITE_URL}/share/${username}/${slug}`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        url,
        images: imageUrl
          ? [
              {
                url: imageUrl,
                width: 1200,
                height: 630,
                alt: title,
              },
            ]
          : [],
        publishedTime: article.pubDate.toISOString(),
        authors: [article.feed.title],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: imageUrl ? [imageUrl] : [],
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
        },
      },
    }
  } catch (error) {
    console.error("Error generating metadata for shared article:", error)
    return {
      title: "Shared Article",
      description: "View this shared article",
    }
  }
}

export default async function ShareLayout({
  children,
  params,
}: ShareLayoutProps) {
  const { username, slug } = await params

  let jsonLd = null

  try {
    const article = await db.query.articleTable.findFirst({
      where: and(
        eq(articleTable.username, username),
        eq(articleTable.shareSlug, slug),
        eq(articleTable.isPubliclyShared, true),
      ),
      with: {
        feed: {
          columns: {
            title: true,
            imageUrl: true,
            url: true,
          },
        },
      },
    })

    if (
      article &&
      (!article.shareExpiresAt ||
        new Date(article.shareExpiresAt) >= new Date())
    ) {
      const url = `${env.NEXT_PUBLIC_SITE_URL}/share/${username}/${slug}`

      jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title,
        description: article.description
          ? stripHtml(article.description)
          : undefined,
        image: article.imageUrl ?? article.feed.imageUrl,
        datePublished: article.pubDate.toISOString(),
        author: {
          "@type": "Organization",
          name: article.feed.title,
          url: article.feed.url,
        },
        publisher: {
          "@type": "Organization",
          name: article.feed.title,
        },
        url,
        mainEntityOfPage: url,
      }
    }
  } catch (error) {
    console.error("Error generating JSON-LD for shared article:", error)
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  )
}
