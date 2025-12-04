import { XMLParser } from "fast-xml-parser"

import { stripHtml } from "@/lib/utils/html"

/**
 * Detects if a URL is a Reddit subreddit URL
 *
 * Supports various formats:
 * - https://www.reddit.com/r/programming
 * - http://reddit.com/r/programming
 * - reddit.com/r/programming
 *
 * @param url - The URL to check
 * @returns True if the URL is a Reddit subreddit URL
 */
export function isRedditUrl(url: string): boolean {
  const redditPattern = /^(https?:\/\/)?(www\.)?reddit\.com\/r\/([a-zA-Z0-9_]+)/
  return redditPattern.test(url)
}

/**
 * Detects if a URL is a Google News RSS feed URL
 *
 * Supports Google News RSS formats:
 * - https://news.google.com/rss (top stories)
 * - https://news.google.com/rss/topics/... (topic feeds)
 * - https://news.google.com/rss/search?q=... (search feeds)
 *
 * @param url - The URL to check
 * @returns True if the URL is a Google News RSS feed URL
 */
export function isGoogleNewsUrl(url: string): boolean {
  return url.includes("news.google.com/rss")
}

/**
 * Constructs a Google News RSS search feed URL from a query string
 *
 * Builds a properly formatted Google News RSS feed URL for the given search query.
 * The URL includes language (en), region (US), and edition (US:en) parameters.
 *
 * @param query - The search query string
 * @returns Google News RSS search URL
 * @example
 * buildGoogleNewsSearchUrl("artificial intelligence")
 * // Returns: "https://news.google.com/rss/search?q=artificial%20intelligence&hl=en&gl=US&ceid=US:en"
 */
export function buildGoogleNewsSearchUrl(query: string): string {
  const encodedQuery = encodeURIComponent(query.trim())
  return `https://news.google.com/rss/search?q=${encodedQuery}&hl=en&gl=US&ceid=US:en`
}

/**
 * Extracts a clean, human-readable title from a Google News RSS feed URL
 *
 * Converts Google News RSS URLs into readable titles:
 * - Topic feeds: Maps known topic IDs to their names
 * - Search feeds: Extracts and decodes the search query
 * - Publisher feeds: Extracts the domain name from allinurl: queries
 *
 * @param url - The Google News RSS feed URL
 * @returns A clean, human-readable title
 * @example
 * generateGoogleNewsTitle("https://news.google.com/rss/search?q=when:24h+allinurl:bbc.com&...")
 * // Returns: "Google News - BBC"
 * @example
 * generateGoogleNewsTitle("https://news.google.com/rss/search?q=artificial+intelligence&...")
 * // Returns: "Google News - artificial intelligence"
 */
export function generateGoogleNewsTitle(url: string): string {
  try {
    const urlObj = new URL(url)

    if (urlObj.pathname === "/rss" || urlObj.pathname === "/rss/") {
      return "Google News - Top Stories"
    }

    if (urlObj.pathname.includes("/topics/")) {
      const topicMap: Record<string, string> = {
        CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB: "World",
        CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB: "Technology",
        CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB: "Business",
        CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y1RjU0FtVnVHZ0pWVXlnQVAB: "Science",
        CAAqIQgKIhtDQkFTRGdvSUwyMHZNR3QwTlRFU0FtVnVLQUFQAQ: "Health",
        CAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0FtVnVHZ0pWVXlnQVAB:
          "Entertainment",
        CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pWVXlnQVAB: "Sports",
      }

      const topicIdRegex = /\/topics\/([^?]+)/
      const topicIdMatch = topicIdRegex.exec(urlObj.pathname)
      if (topicIdMatch) {
        const topicId = topicIdMatch[1]
        const topicName = topicMap[topicId]
        if (topicName) {
          return `Google News - ${topicName}`
        }
      }
      return "Google News"
    }

    if (urlObj.pathname.includes("/search")) {
      const searchParams = urlObj.searchParams
      const query = searchParams.get("q")

      if (query) {
        const publisherRegex = /allinurl:([a-z0-9.-]+)/i
        const publisherMatch = publisherRegex.exec(query)
        if (publisherMatch) {
          const domain = publisherMatch[1]
          const domainName = domain.split(".")[0]
          return `Google News - ${domainName.toUpperCase()}`
        }

        const decodedQuery = decodeURIComponent(query)
          .replace(/when:\d+[hdwmy]/g, "")
          .replace(/\+/g, " ")
          .trim()

        return decodedQuery ? `Google News - ${decodedQuery}` : "Google News"
      }
    }

    return "Google News"
  } catch {
    return "Google News"
  }
}

/**
 * Normalizes a Reddit subreddit URL to standard format
 *
 * Converts various Reddit URL formats to:
 * https://www.reddit.com/r/{subreddit}
 *
 * @param url - The Reddit URL to normalize
 * @returns Normalized Reddit URL
 * @throws Error if URL is not a valid Reddit subreddit URL
 */
export function normalizeRedditUrl(url: string): string {
  const subreddit = extractSubredditName(url)
  return `https://www.reddit.com/r/${subreddit}`
}

/**
 * Extracts the subreddit name from a Reddit URL
 *
 * @param url - The Reddit URL to parse
 * @returns The subreddit name (without /r/ prefix)
 * @throws Error if URL is not a valid Reddit subreddit URL
 */
export function extractSubredditName(url: string): string {
  const redditPattern = /^(https?:\/\/)?(www\.)?reddit\.com\/r\/([a-zA-Z0-9_]+)/
  const match = redditPattern.exec(url)

  if (!match?.[3]) {
    throw new Error(
      "Invalid Reddit URL format. Expected: https://reddit.com/r/subreddit",
    )
  }

  return match[3]
}

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
  redditPostId?: string
  redditPermalink?: string
  redditSubreddit?: string
}

/**
 * Reddit API response types
 */
interface RedditPost {
  data: {
    id: string
    title: string
    selftext: string
    url: string
    permalink: string
    author: string
    created_utc: number
    thumbnail?: string
    subreddit: string
    is_self: boolean
  }
}

interface RedditApiResponse {
  data: {
    children: RedditPost[]
  }
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
 * Fetches Reddit posts from a subreddit using the public JSON API
 *
 * Retrieves the latest posts from a subreddit without authentication.
 * Reddit's public API returns up to 25 posts by default.
 *
 * @param subredditName - The name of the subreddit (without /r/ prefix)
 * @returns Reddit API response containing post data
 * @throws Error if fetch fails, rate limited, or subreddit is invalid
 */
async function fetchRedditPosts(
  subredditName: string,
): Promise<RedditApiResponse> {
  const url = `https://www.reddit.com/r/${subredditName}.json`
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (compatible; FeedReader/1.0; +https://github.com/your-repo)",
  }

  try {
    const response = await fetch(url, { headers })

    if (response.status === 429) {
      throw new Error(
        "Reddit rate limit exceeded. Please try again in a few minutes.",
      )
    }

    if (response.status === 404) {
      throw new Error(
        `Subreddit "${subredditName}" not found. Please check the subreddit name and try again.`,
      )
    }

    if (response.status === 403) {
      throw new Error(
        `Subreddit "${subredditName}" is private, banned, or quarantined.`,
      )
    }

    if (!response.ok) {
      throw new Error(
        `Failed to fetch Reddit posts: ${response.status} ${response.statusText}`,
      )
    }

    const data = (await response.json()) as RedditApiResponse

    return data
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to fetch Reddit posts. Please try again later.")
  }
}

/**
 * Parses a Reddit subreddit feed and extracts posts as articles
 *
 * Fetches posts from Reddit's public JSON API and converts them to
 * the standard article format. Includes Reddit-specific metadata like
 * post ID, permalink, and subreddit for comment linking.
 *
 * @param url - The Reddit subreddit URL
 * @returns Object containing feed metadata and array of parsed articles
 * @throws Error if subreddit cannot be fetched or parsed
 */
async function parseRedditFeed(url: string) {
  try {
    const subredditName = extractSubredditName(url)

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Reddit request timed out. Please try again later."))
      }, 15000)
    })

    const data = await Promise.race([
      fetchRedditPosts(subredditName),
      timeoutPromise,
    ])

    if (data.data.children.length === 0) {
      throw new Error(
        `No posts found in subreddit "${subredditName}". The subreddit might be empty or restricted.`,
      )
    }

    const feedTitle = `r/${subredditName}`
    const feedDescription = `Posts from the ${subredditName} subreddit`

    const truncate = (str = "") =>
      str.length > 300 ? `${str.substring(0, 300)}…` : str

    const articles = data.data.children
      .map((post, idx): ScrapedArticleFeed | null => {
        const postData = post.data
        const title = postData.title.trim()
        const link = postData.is_self
          ? `https://www.reddit.com${postData.permalink}`
          : postData.url

        if (!title || !link) {
          console.warn(
            `Skipping invalid Reddit post at index ${idx}: missing title or link`,
          )
          return null
        }

        const description = postData.selftext
          ? truncate(postData.selftext)
          : postData.is_self
            ? "Discussion post on Reddit"
            : `External link: ${link}`

        // For self posts, convert markdown-like text to HTML with proper formatting
        // For link posts, provide a formatted message
        const content = postData.selftext
          ? postData.selftext
              .split("\n\n")
              .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
              .join("")
          : postData.is_self
            ? ""
            : `<p>This is a link post to an external resource.</p><p><a href="${link}" target="_blank" rel="noopener noreferrer">Open external link: ${link}</a></p>`

        const thumbnail =
          postData.thumbnail &&
          postData.thumbnail !== "self" &&
          postData.thumbnail !== "default" &&
          postData.thumbnail.startsWith("http")
            ? postData.thumbnail
            : undefined

        return {
          id: `reddit-${postData.id}-${Date.now()}-${idx}`,
          title,
          description,
          link,
          pubDate: new Date(postData.created_utc * 1000).toISOString(),
          source: `u/${postData.author}`,
          isRead: false,
          isReadLater: false,
          content,
          imageUrl: thumbnail,
          redditPostId: postData.id,
          redditPermalink: postData.permalink,
          redditSubreddit: postData.subreddit,
        }
      })
      .filter((article): article is ScrapedArticleFeed => article !== null)

    if (articles.length === 0) {
      throw new Error(`No valid posts found in subreddit "${subredditName}".`)
    }

    return {
      title: feedTitle,
      description: feedDescription,
      articles,
      imageUrl: undefined,
    }
  } catch (error) {
    console.error("Error parsing Reddit feed:", error)

    if (error instanceof Error) {
      if (
        error.message.includes("rate limit") ||
        error.message.includes("not found") ||
        error.message.includes("private") ||
        error.message.includes("timed out")
      ) {
        throw error
      }
    }

    throw new Error(
      "Failed to fetch Reddit feed. Please ensure the subreddit URL is valid and try again.",
    )
  }
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
 * Parses an RSS, Atom, Reddit, or Google News feed and extracts feed metadata and articles
 *
 * Supports RSS 2.0, Atom feed formats, Reddit subreddits, and Google News RSS feeds.
 * Automatically detects feed type and routes to appropriate parser. Extracts feed title,
 * description, image, and article data.
 *
 * @param url - The URL of the feed to parse (RSS/Atom, Reddit subreddit, or Google News)
 * @param feedType - Optional feed type override ('rss', 'reddit', or 'google_news')
 * @returns Object containing feed metadata and array of parsed articles
 * @throws Error if feed cannot be fetched, parsed, or contains invalid data
 */
export async function parseFeed(
  url: string,
  feedType?: "rss" | "reddit" | "google_news",
): Promise<{
  title: string
  description: string
  articles: ScrapedArticleFeed[]
  imageUrl?: string
}> {
  if (feedType === "reddit" || isRedditUrl(url)) {
    return parseRedditFeed(url)
  }

  if (feedType === "google_news" || isGoogleNewsUrl(url)) {
    return parseRSSFeed(url)
  }

  return parseRSSFeed(url)
}

/**
 * Parses an RSS or Atom feed and extracts feed metadata and articles
 *
 * Internal function for RSS/Atom parsing. Use parseFeed() for public API.
 *
 * @param url - The URL of the RSS/Atom feed to parse
 * @returns Object containing feed metadata and array of parsed articles
 * @throws Error if feed cannot be fetched, parsed, or contains invalid data
 */
async function parseRSSFeed(url: string) {
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
                  : stripHtml(description),
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
            content: item["content:encoded"] ?? stripHtml(description),
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
