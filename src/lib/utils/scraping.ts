import { XMLParser } from "fast-xml-parser"

import { sanitizeHtml, stripHtml } from "@/lib/utils/html"

export function isRedditUrl(url: string): boolean {
  const redditPattern = /^(https?:\/\/)?(www\.)?reddit\.com\/r\/([a-zA-Z0-9_]+)/
  return redditPattern.test(url)
}

export function isGoogleNewsUrl(url: string): boolean {
  return url.includes("news.google.com/rss")
}

export function buildGoogleNewsSearchUrl(query: string): string {
  const encodedQuery = encodeURIComponent(query.trim())
  return `https://news.google.com/rss/search?q=${encodedQuery}&hl=en&gl=US&ceid=US:en`
}

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

export function normalizeRedditUrl(url: string): string {
  const subreddit = extractSubredditName(url)
  return `https://www.reddit.com/r/${subreddit}`
}

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
              typeof description === "string"
                ? stripHtml(description.trim())
                : "",
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
                  : sanitizeHtml(description),
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
              typeof description === "string"
                ? stripHtml(description.trim())
                : "",
            ),
            link: typeof link === "string" ? link.trim() : "",
            pubDate,
            source: feedTitle.trim(),
            isRead: false,
            isReadLater: false,
            content: item["content:encoded"] ?? sanitizeHtml(description),
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
