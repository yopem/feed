/**
 * Sample RSS 2.0 feed XML for testing
 * Contains typical RSS feed structure with multiple items
 */
export const sampleRSS2Feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Blog</title>
    <link>https://example.com</link>
    <description>A test blog for RSS parsing</description>
    <language>en-us</language>
    <lastBuildDate>Mon, 01 Jan 2024 00:00:00 GMT</lastBuildDate>
    <image>
      <url>https://example.com/logo.png</url>
      <title>Test Blog</title>
      <link>https://example.com</link>
    </image>
    <item>
      <title>First Post</title>
      <link>https://example.com/first-post</link>
      <description>This is the first post description</description>
      <content:encoded><![CDATA[<p>This is the full content of the first post</p>]]></content:encoded>
      <pubDate>Mon, 01 Jan 2024 12:00:00 GMT</pubDate>
      <guid>https://example.com/first-post</guid>
    </item>
    <item>
      <title>Second Post</title>
      <link>https://example.com/second-post</link>
      <description>This is the second post description</description>
      <content:encoded><![CDATA[<p>This is the full content of the second post</p>]]></content:encoded>
      <pubDate>Mon, 02 Jan 2024 12:00:00 GMT</pubDate>
      <guid>https://example.com/second-post</guid>
    </item>
    <item>
      <title>Third Post</title>
      <link>https://example.com/third-post</link>
      <description>This is the third post description</description>
      <pubDate>Mon, 03 Jan 2024 12:00:00 GMT</pubDate>
      <guid>https://example.com/third-post</guid>
    </item>
  </channel>
</rss>`

/**
 * Sample Atom feed XML for testing
 * Contains typical Atom feed structure
 */
export const sampleAtomFeed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Test Atom Feed</title>
  <link href="https://example.com"/>
  <updated>2024-01-01T00:00:00Z</updated>
  <author>
    <name>Test Author</name>
  </author>
  <id>https://example.com/feed</id>
  <entry>
    <title>Atom Entry One</title>
    <link href="https://example.com/atom-entry-1"/>
    <id>https://example.com/atom-entry-1</id>
    <updated>2024-01-01T12:00:00Z</updated>
    <summary>Summary of atom entry one</summary>
    <content type="html"><![CDATA[<p>Full content of atom entry one</p>]]></content>
  </entry>
  <entry>
    <title>Atom Entry Two</title>
    <link href="https://example.com/atom-entry-2"/>
    <id>https://example.com/atom-entry-2</id>
    <updated>2024-01-02T12:00:00Z</updated>
    <summary>Summary of atom entry two</summary>
    <content type="html"><![CDATA[<p>Full content of atom entry two</p>]]></content>
  </entry>
</feed>`

/**
 * Malformed RSS feed for testing error handling
 */
export const malformedRSSFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Broken Feed</title>
    <link>https://example.com</link>
    <item>
      <title>Incomplete Item
      <link>https://example.com/broken</link>
    </item>
  </channel>
`

/**
 * Empty RSS feed for testing edge cases
 */
export const emptyRSSFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Empty Feed</title>
    <link>https://example.com</link>
    <description>A feed with no items</description>
  </channel>
</rss>`

/**
 * RSS feed with special characters for testing encoding
 */
export const specialCharsRSSFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Special Chars Feed</title>
    <link>https://example.com</link>
    <description>Testing special characters &amp; entities</description>
    <item>
      <title>Post with &lt;HTML&gt; &amp; Special Chars</title>
      <link>https://example.com/special-chars</link>
      <description>Description with "quotes" and 'apostrophes'</description>
      <pubDate>Mon, 01 Jan 2024 12:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`

/**
 * Mock RSS feed response with HTTP headers
 */
export function createMockFeedResponse(
  xml: string,
  options?: {
    status?: number
    contentType?: string
    lastModified?: string
    etag?: string
  },
): Response {
  const headers = new Headers()
  headers.set("content-type", options?.contentType ?? "application/rss+xml")

  if (options?.lastModified) {
    headers.set("last-modified", options.lastModified)
  }

  if (options?.etag) {
    headers.set("etag", options.etag)
  }

  return new Response(xml, {
    status: options?.status ?? 200,
    headers,
  })
}
