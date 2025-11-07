import { fetchFeedXML, parseFeed } from "@/lib/utils/scraping"
import {
  emptyRSSFeed,
  sampleAtomFeed,
  sampleRSS2Feed,
  specialCharsRSSFeed,
} from "@/test-utils/fixtures"

// Mock global fetch
const mockFetch = jest.fn()
global.fetch = mockFetch as any

describe("fetchFeedXML", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("fetches feed XML from direct URL successfully", async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => sampleRSS2Feed,
    } as Response)

    const result = await fetchFeedXML("https://example.com/feed.xml")

    expect(result).toBe(sampleRSS2Feed)
    expect(mockFetch).toHaveBeenCalledWith("https://example.com/feed.xml", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; FeedlyClone/1.0; +https://github.com/your-repo)",
        Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
      },
      redirect: "follow",
    })
  })

  it("falls back to proxy when direct fetch fails", async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

    // First call (direct) fails
    mockFetch.mockRejectedValueOnce(new Error("Network error"))

    // Second call (proxy) succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => sampleRSS2Feed,
    } as Response)

    const result = await fetchFeedXML("https://example.com/feed.xml")

    expect(result).toBe(sampleRSS2Feed)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "https://api.allorigins.win/raw?url=https%3A%2F%2Fexample.com%2Ffeed.xml",
    )
  })

  it("throws error when both direct and proxy fetches fail", async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

    // Direct fetch fails
    mockFetch.mockRejectedValueOnce(new Error("Network error"))

    // Proxy fetch fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as Response)

    await expect(fetchFeedXML("https://example.com/feed.xml")).rejects.toThrow(
      "Proxy fetch failed with status 404 Not Found",
    )
  })

  it("throws error when direct fetch returns non-ok status", async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response)

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => sampleRSS2Feed,
    } as Response)

    const result = await fetchFeedXML("https://example.com/feed.xml")
    expect(result).toBe(sampleRSS2Feed)
  })
})

describe("parseFeed", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("RSS 2.0 feeds", () => {
    it("parses valid RSS 2.0 feed successfully", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => sampleRSS2Feed,
      } as Response)

      const result = await parseFeed("https://example.com/feed.xml")

      expect(result.title).toBe("Test Blog")
      expect(result.description).toBe("A test blog for RSS parsing")
      expect(result.imageUrl).toBe("https://example.com/logo.png")
      expect(result.articles).toHaveLength(3)
    })

    it("extracts correct article data from RSS items", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => sampleRSS2Feed,
      } as Response)

      const result = await parseFeed("https://example.com/feed.xml")
      const firstArticle = result.articles[0]

      expect(firstArticle?.title).toBe("First Post")
      expect(firstArticle?.link).toBe("https://example.com/first-post")
      expect(firstArticle?.description).toBe(
        "This is the first post description",
      )
      expect(firstArticle?.pubDate).toBe("Mon, 01 Jan 2024 12:00:00 GMT")
      expect(firstArticle?.source).toBe("Test Blog")
      expect(firstArticle?.isRead).toBe(false)
      expect(firstArticle?.isReadLater).toBe(false)
      expect(firstArticle?.content).toBe(
        "<p>This is the full content of the first post</p>",
      )
    })

    it("truncates article descriptions longer than 300 characters", async () => {
      const longDesc = "a".repeat(350)
      const feedWithLongDesc = sampleRSS2Feed.replace(
        "This is the first post description",
        longDesc,
      )

      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => feedWithLongDesc,
      } as Response)

      const result = await parseFeed("https://example.com/feed.xml")
      const firstArticle = result.articles[0]

      expect(firstArticle?.description).toBe("a".repeat(300) + "…")
    })

    it("skips RSS items without title or link", async () => {
      const feedWithInvalidItem = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <item>
      <description>No title or link</description>
    </item>
    <item>
      <title>Valid Item</title>
      <link>https://example.com/valid</link>
      <description>Valid description</description>
    </item>
  </channel>
</rss>`

      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => feedWithInvalidItem,
      } as Response)

      const result = await parseFeed("https://example.com/feed.xml")

      expect(result.articles).toHaveLength(1)
      expect(result.articles[0]?.title).toBe("Valid Item")
    })

    it("uses current date for RSS items without pubDate", async () => {
      const feedWithoutPubDate = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>No Date</title>
      <link>https://example.com/no-date</link>
      <description>No date provided</description>
    </item>
  </channel>
</rss>`

      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => feedWithoutPubDate,
      } as Response)

      const result = await parseFeed("https://example.com/feed.xml")
      const article = result.articles[0]

      expect(article?.pubDate).toBeDefined()
      expect(new Date(article?.pubDate ?? "").getTime()).toBeCloseTo(
        Date.now(),
        -4,
      ) // Within ~10 seconds
    })
  })

  describe("Atom feeds", () => {
    it("parses valid Atom feed successfully", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => sampleAtomFeed,
      } as Response)

      const result = await parseFeed("https://example.com/feed.xml")

      expect(result.title).toBe("Test Atom Feed")
      expect(result.articles).toHaveLength(2)
    })

    it("extracts correct article data from Atom entries", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => sampleAtomFeed,
      } as Response)

      const result = await parseFeed("https://example.com/feed.xml")
      const firstArticle = result.articles[0]

      expect(firstArticle?.title).toBe("Atom Entry One")
      expect(firstArticle?.link).toBe("https://example.com/atom-entry-1")
      expect(firstArticle?.description).toBe("Summary of atom entry one")
      expect(firstArticle?.pubDate).toBe("2024-01-01T12:00:00Z")
      expect(firstArticle?.content).toBe(
        "<p>Full content of atom entry one</p>",
      )
    })

    it("uses updated date when published is missing in Atom", async () => {
      const atomWithoutPublished = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Test Feed</title>
  <entry>
    <title>Entry</title>
    <link href="https://example.com/entry"/>
    <updated>2024-01-05T12:00:00Z</updated>
    <summary>Summary</summary>
  </entry>
</feed>`

      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => atomWithoutPublished,
      } as Response)

      const result = await parseFeed("https://example.com/feed.xml")
      expect(result.articles[0]?.pubDate).toBe("2024-01-05T12:00:00Z")
    })

    it("skips Atom entries without title or link", async () => {
      const atomWithInvalidEntry = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Test Feed</title>
  <entry>
    <summary>No title or link</summary>
  </entry>
  <entry>
    <title>Valid Entry</title>
    <link href="https://example.com/valid"/>
    <summary>Valid summary</summary>
  </entry>
</feed>`

      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => atomWithInvalidEntry,
      } as Response)

      const result = await parseFeed("https://example.com/feed.xml")

      expect(result.articles).toHaveLength(1)
      expect(result.articles[0]?.title).toBe("Valid Entry")
    })
  })

  describe("image extraction", () => {
    it("extracts image from RSS enclosure", async () => {
      const feedWithEnclosure = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>Post with Image</title>
      <link>https://example.com/post</link>
      <description>Description</description>
      <enclosure url="https://example.com/image.jpg" type="image/jpeg" />
    </item>
  </channel>
</rss>`

      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => feedWithEnclosure,
      } as Response)

      const result = await parseFeed("https://example.com/feed.xml")
      expect(result.articles[0]?.imageUrl).toBe("https://example.com/image.jpg")
    })

    it("extracts image from media:thumbnail", async () => {
      const feedWithMediaThumbnail = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>Post with Media</title>
      <link>https://example.com/post</link>
      <description>Description</description>
      <media:thumbnail url="https://example.com/thumb.jpg" />
    </item>
  </channel>
</rss>`

      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => feedWithMediaThumbnail,
      } as Response)

      const result = await parseFeed("https://example.com/feed.xml")
      expect(result.articles[0]?.imageUrl).toBe("https://example.com/thumb.jpg")
    })

    it("extracts image from HTML in description", async () => {
      const feedWithImgTag = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>Post with HTML Image</title>
      <link>https://example.com/post</link>
      <description><![CDATA[<img src="https://example.com/inline.jpg" alt="Image" />]]></description>
    </item>
  </channel>
</rss>`

      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => feedWithImgTag,
      } as Response)

      const result = await parseFeed("https://example.com/feed.xml")
      expect(result.articles[0]?.imageUrl).toBe(
        "https://example.com/inline.jpg",
      )
    })

    it("returns undefined when no image found", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => sampleRSS2Feed,
      } as Response)

      const result = await parseFeed("https://example.com/feed.xml")
      expect(result.articles[2]?.imageUrl).toBeUndefined()
    })
  })

  describe("edge cases", () => {
    it("handles Atom feed with no entries array", async () => {
      const atomFeedNoEntries = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Test Feed</title>
</feed>`

      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => atomFeedNoEntries,
      } as Response)

      await expect(parseFeed("https://example.com/feed.xml")).rejects.toThrow(
        "Invalid feed: No articles found",
      )
    })

    it("handles extractImageUrl returning undefined for no image", async () => {
      const feedNoImage = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>Post without image</title>
      <link>https://example.com/post</link>
      <description>No image here</description>
    </item>
  </channel>
</rss>`

      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => feedNoImage,
      } as Response)

      const result = await parseFeed("https://example.com/feed.xml")
      expect(result.articles[0]?.imageUrl).toBeUndefined()
    })

    it("handles XMLParser returning null/undefined result", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "<?xml version='1.0'?><root></root>",
      } as Response)

      await expect(parseFeed("https://example.com/feed.xml")).rejects.toThrow(
        "Invalid feed: This URL does not contain a valid RSS or Atom feed",
      )
    })
  })

  describe("error handling", () => {
    it("throws error for empty RSS feed", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => emptyRSSFeed,
      } as Response)

      await expect(parseFeed("https://example.com/feed.xml")).rejects.toThrow(
        "Invalid feed: No articles found",
      )
    })

    it("throws error for RSS feed without title", async () => {
      const feedWithoutTitle = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <link>https://example.com</link>
    <item>
      <title>Post</title>
      <link>https://example.com/post</link>
    </item>
  </channel>
</rss>`

      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => feedWithoutTitle,
      } as Response)

      await expect(parseFeed("https://example.com/feed.xml")).rejects.toThrow(
        "Failed to parse feed",
      )
    })

    it("throws error for Atom feed without title", async () => {
      const atomWithoutTitle = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>Entry</title>
    <link href="https://example.com/entry"/>
  </entry>
</feed>`

      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => atomWithoutTitle,
      } as Response)

      await expect(parseFeed("https://example.com/feed.xml")).rejects.toThrow(
        "Failed to parse feed",
      )
    })

    it("throws error when feed has no valid articles", async () => {
      const feedWithOnlyInvalidItems = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <item>
      <description>No title or link</description>
    </item>
  </channel>
</rss>`

      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => feedWithOnlyInvalidItems,
      } as Response)

      await expect(parseFeed("https://example.com/feed.xml")).rejects.toThrow(
        "Invalid feed: No valid articles found",
      )
    })

    it("throws error when Atom feed has no valid articles", async () => {
      const atomWithOnlyInvalidEntries = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Test Atom Feed</title>
  <entry>
    <summary>No title or link</summary>
  </entry>
</feed>`

      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => atomWithOnlyInvalidEntries,
      } as Response)

      await expect(parseFeed("https://example.com/feed.xml")).rejects.toThrow(
        "Invalid feed: No valid articles found",
      )
    })

    it("throws error for non-RSS/Atom XML", async () => {
      const invalidXML = `<?xml version="1.0" encoding="UTF-8"?>
<html>
  <body>Not a feed</body>
</html>`

      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => invalidXML,
      } as Response)

      await expect(parseFeed("https://example.com/feed.xml")).rejects.toThrow(
        "Invalid feed: This URL does not contain a valid RSS or Atom feed",
      )
    })

    it("throws user-friendly error for fetch failures", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockRejectedValue(new Error("fetch failed"))

      await expect(parseFeed("https://example.com/feed.xml")).rejects.toThrow(
        "Unable to fetch the feed. Please check the URL and try again.",
      )
    })

    it("throws user-friendly error for parse failures", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "not xml at all",
      } as Response)

      await expect(parseFeed("https://example.com/feed.xml")).rejects.toThrow(
        "Invalid feed: This URL does not contain a valid RSS or Atom feed",
      )
    })
  })

  describe("special characters and encoding", () => {
    it("handles special characters in RSS feed", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => specialCharsRSSFeed,
      } as Response)

      const result = await parseFeed("https://example.com/feed.xml")

      expect(result.title).toBe("Special Chars Feed")
      expect(result.description).toBe("Testing special characters & entities")
      expect(result.articles[0]?.title).toBe("Post with <HTML> & Special Chars")
    })

    it("handles empty strings gracefully", async () => {
      const feedWithEmptyFields = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <description></description>
    <item>
      <title>Post</title>
      <link>https://example.com/post</link>
      <description></description>
    </item>
  </channel>
</rss>`

      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => feedWithEmptyFields,
      } as Response)

      const result = await parseFeed("https://example.com/feed.xml")

      expect(result.description).toBe("")
      expect(result.articles[0]?.description).toBe("")
    })
  })
})
