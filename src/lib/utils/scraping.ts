import { XMLParser } from "fast-xml-parser"

interface ScrapedArticleFeed {
  id: string
  title: string
  description: string
  link: string
  pubDate: string
  source: string
  isRead: boolean
  isReadLater: boolean
  content?: string
  imageUrl?: string
}

interface AtomEntry {
  title?: { "#text"?: string } | string
  link?: { "@_href"?: string; href?: string } | string
  summary?: { "#text"?: string } | string
  content?: { "#text"?: string } | string
  published?: string
  updated?: string
  enclosure?: { "@_url"?: string; url?: string }
  "media:thumbnail"?: { "@_url"?: string; url?: string }
  "media:content"?: { "@_url"?: string; url?: string }
  image?: string
  "itunes:image"?: { "@_href"?: string; href?: string }
  description?: string
  "content:encoded"?: string
}

interface RSSItem {
  title?: string
  link?: string
  description?: string
  pubDate?: string
  "content:encoded"?: string
  enclosure?: { "@_url"?: string; url?: string }
  "media:thumbnail"?: { "@_url"?: string; url?: string }
  "media:content"?: { "@_url"?: string; url?: string }
  image?: string
  "itunes:image"?: { "@_href"?: string; href?: string }
}

function extractImageUrl(item: AtomEntry | RSSItem): string | undefined {
  const sources = [
    item.enclosure?.["@_url"] ?? item.enclosure?.url,
    item["media:thumbnail"]?.["@_url"] ?? item["media:thumbnail"]?.url,
    item["media:content"]?.["@_url"] ?? item["media:content"]?.url,
    item.image,
    item["itunes:image"]?.["@_href"] ?? item["itunes:image"]?.href,
  ]

  for (const src of sources) {
    if (src && typeof src === "string" && src.trim()) {
      return src.trim()
    }
  }

  const description = item.description ?? ""
  const content = item["content:encoded"] ?? ""
  const combinedText = description + " " + content

  if (typeof combinedText === "string") {
    const imgMatch = /<img[^>]+src=["']([^"']+)["'][^>]*>/i.exec(combinedText)
    return imgMatch?.[1]
  }

  return undefined
}

/**
 * Fetches RSS/Atom feed XML content with automatic proxy fallback
 *
 * Attempts direct fetch first, then falls back to a proxy service
 * if the direct request fails due to CORS or network issues.
 *
 * @param feedUrl - The URL of the RSS/Atom feed to fetch
 * @returns The raw XML content of the feed
 * @throws Error if both direct and proxy fetch attempts fail
 */
export async function fetchFeedXML(feedUrl: string): Promise<string> {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (compatible; FeedlyClone/1.0; +https://github.com/your-repo)",
    Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
  }

  try {
    const directRes = await fetch(feedUrl, { headers, redirect: "follow" })
    if (directRes.ok) return await directRes.text()
    throw new Error(
      `Direct fetch failed with status ${directRes.status} ${directRes.statusText}`,
    )
  } catch (directErr) {
    console.warn(
      `[parseFeed] Direct fetch failed for ${feedUrl}. Falling back to proxy.\n`,
      directErr,
    )
    const proxyRes = await fetch(
      `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`,
    )
    if (!proxyRes.ok) {
      throw new Error(
        `Proxy fetch failed with status ${proxyRes.status} ${proxyRes.statusText}`,
      )
    }
    return proxyRes.text()
  }
}

/**
 * Parses an RSS or Atom feed and extracts feed metadata and articles
 *
 * Supports both RSS 2.0 and Atom feed formats. Extracts feed title,
 * description, image, and article data including title, link, description,
 * publication date, and embedded images.
 *
 * @param url - The URL of the RSS/Atom feed to parse
 * @returns Object containing feed metadata and array of parsed articles
 * @throws Error if feed cannot be fetched, parsed, or contains invalid data
 */
export async function parseFeed(url: string) {
  try {
    const xmlString = await fetchFeedXML(url)

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
      parseAttributeValue: false,
    })

    const result = parser.parse(xmlString)

    if (!result) {
      throw new Error("Invalid feed: Unable to parse XML content")
    }

    const truncate = (str = "") =>
      str.length > 300 ? `${str.substring(0, 300)}…` : str

    if (result.feed) {
      const feed = result.feed
      const feedTitle = feed.title?.["#text"] ?? feed.title
      const feedDescription = feed.subtitle?.["#text"] ?? feed.subtitle ?? ""
      const feedImageUrl =
        feed.icon?.["#text"] ?? feed.icon ?? feed.logo?.["#text"] ?? feed.logo

      if (
        !feedTitle ||
        typeof feedTitle !== "string" ||
        feedTitle.trim() === ""
      ) {
        throw new Error("Invalid Atom feed: Missing or empty title")
      }

      const entries = Array.isArray(feed.entry)
        ? feed.entry
        : [feed.entry].filter(Boolean)

      if (entries.length === 0) {
        throw new Error("Invalid feed: No articles found")
      }

      const articles: ScrapedArticleFeed[] = entries
        .map((entry: AtomEntry, idx: number) => {
          const title =
            typeof entry.title === "object" && entry.title["#text"]
              ? entry.title["#text"]
              : typeof entry.title === "string"
                ? entry.title
                : ""
          const link =
            typeof entry.link === "object" && entry.link["@_href"]
              ? entry.link["@_href"]
              : typeof entry.link === "object" && entry.link.href
                ? entry.link.href
                : typeof entry.link === "string"
                  ? entry.link
                  : ""
          const description =
            typeof entry.summary === "object" && entry.summary["#text"]
              ? entry.summary["#text"]
              : typeof entry.summary === "string"
                ? entry.summary
                : typeof entry.content === "object" && entry.content["#text"]
                  ? entry.content["#text"]
                  : typeof entry.content === "string"
                    ? entry.content
                    : ""
          const pubDate =
            entry.published ?? entry.updated ?? new Date().toISOString()
          const imageUrl = extractImageUrl(entry)

          if (!title || !link) {
            console.warn(
              `Skipping invalid article at index ${idx}: missing title or link`,
            )
            return null
          }

          return {
            id: `${Date.now()}-${idx}`,
            title: typeof title === "string" ? title.trim() : "",
            description: truncate(
              typeof description === "string" ? description.trim() : "",
            ),
            link: typeof link === "string" ? link.trim() : "",
            pubDate,
            source: feedTitle.trim(),
            isRead: false,
            isReadLater: false,
            content:
              typeof entry.content === "object" && entry.content["#text"]
                ? entry.content["#text"]
                : typeof entry.content === "string"
                  ? entry.content
                  : description,
            imageUrl,
          }
        })
        .filter(Boolean)

      if (articles.length === 0) {
        throw new Error("Invalid feed: No valid articles found")
      }

      return {
        title: feedTitle.trim(),
        description:
          typeof feedDescription === "string" ? feedDescription.trim() : "",
        articles,
        imageUrl: typeof feedImageUrl === "string" ? feedImageUrl : undefined,
      }
    }

    if (result.rss?.channel) {
      const channel = result.rss.channel
      const feedTitle = channel.title
      const feedDescription = channel.description ?? ""
      const feedImageUrl =
        channel.image?.url ?? channel["itunes:image"]?.["@_href"]

      if (
        !feedTitle ||
        typeof feedTitle !== "string" ||
        feedTitle.trim() === ""
      ) {
        throw new Error("Invalid RSS feed: Missing or empty title")
      }

      const items = Array.isArray(channel.item)
        ? channel.item
        : [channel.item].filter(Boolean)

      if (items.length === 0) {
        throw new Error("Invalid feed: No articles found")
      }

      const articles: ScrapedArticleFeed[] = items
        .map((item: RSSItem, idx: number) => {
          const title = item.title ?? ""
          const link = item.link ?? ""
          const description = item.description ?? ""
          const pubDate = item.pubDate ?? new Date().toISOString()
          const imageUrl = extractImageUrl(item)

          if (!title || !link) {
            console.warn(
              `Skipping invalid article at index ${idx}: missing title or link`,
            )
            return null
          }

          return {
            id: `${Date.now()}-${idx}`,
            title: typeof title === "string" ? title.trim() : "",
            description: truncate(
              typeof description === "string" ? description.trim() : "",
            ),
            link: typeof link === "string" ? link.trim() : "",
            pubDate,
            source: feedTitle.trim(),
            isRead: false,
            isReadLater: false,
            content: item["content:encoded"] ?? description,
            imageUrl,
          }
        })
        .filter(Boolean)

      if (articles.length === 0) {
        throw new Error("Invalid feed: No valid articles found")
      }

      return {
        title: feedTitle.trim(),
        description:
          typeof feedDescription === "string" ? feedDescription.trim() : "",
        articles,
        imageUrl: typeof feedImageUrl === "string" ? feedImageUrl : undefined,
      }
    }

    throw new Error(
      "Invalid feed: This URL does not contain a valid RSS or Atom feed",
    )
  } catch (err) {
    console.error("Error parsing feed:", err)

    if (err instanceof Error) {
      if (err.message.includes("fetch failed")) {
        throw new Error(
          "Unable to fetch the feed. Please check the URL and try again.",
        )
      }
      if (err.message.includes("Invalid feed")) {
        throw err
      }
      if (err.message.includes("parse")) {
        throw new Error("This URL does not contain a valid RSS or Atom feed.")
      }
    }

    throw new Error(
      "Failed to parse feed. Please ensure the URL points to a valid RSS or Atom feed.",
    )
  }
}
