import { describe, expect, test } from "bun:test"
import {
  createPinnedLookup,
  fetchFeed,
  isPublicAddress,
  parseFeed,
  validateFeedUrl,
} from "server/lib/rss"

const url = "https://example.com/feed"

function rss(items: string, title = "Example") {
  return `<rss version="2.0"><channel><title>${title}</title>${items}</channel></rss>`
}

function item(content = "Hello", link = "/article") {
  return `<item><guid>article-1</guid><title>Article</title><link>${link}</link><description>${content}</description><pubDate>Tue, 01 Jan 2030 00:00:00 GMT</pubDate></item>`
}

describe("RSS parsing", () => {
  test("RSS 2 metadata, relative links, entities and plain content", () => {
    const feed = parseFeed(
      rss(
        item(
          "<![CDATA[<p>Hello &amp; <b>world</b>&nbsp;&#x1F600;</p><script>alert(1)</script>]]>",
        ),
        "News &amp; updates",
      ),
      url,
    )
    expect(feed.title).toBe("News & updates")
    expect(feed.url).toBe(url)
    expect(feed.articles).toEqual([
      {
        guid: "article-1",
        title: "Article",
        url: "https://example.com/article",
        content: "Hello & world 😀",
        publishedAt: new Date("2030-01-01T00:00:00Z"),
      },
    ])
  })

  test("Atom alternate links, HTML and XHTML content", () => {
    const feed = parseFeed(
      `<feed xmlns="http://www.w3.org/2005/Atom"><title>Atom</title><entry><id>tag:example,1</id><title>One</title><link rel="self" href="/api"/><link rel="alternate" href="/one"/><content type="html">&lt;p&gt;A &amp;amp; B&lt;/p&gt;</content><updated>invalid</updated></entry><entry><link href="/two"/><content type="xhtml"><div xmlns="http://www.w3.org/1999/xhtml"><p>Safe <b>text</b> after <i>end</i></p></div></content></entry></feed>`,
      url,
    )
    expect(feed.articles[0]).toMatchObject({
      guid: "tag:example,1",
      url: "https://example.com/one",
      content: "A & B",
      publishedAt: null,
    })
    expect(feed.articles[1]?.content).toBe("Safe text after end")
  })

  test("encoded markup cannot survive as HTML", () => {
    const feed = parseFeed(
      rss(item("&amp;lt;img src=x onerror=alert(1)&amp;gt;Hello")),
      url,
    )
    expect(feed.articles[0]?.content).not.toMatch(/[<>]/)
  })

  test("caps articles and rejects oversized bodies", () => {
    const items = Array.from({ length: 101 }, (_, index) =>
      item().replace("article-1", `article-${index}`),
    ).join("")
    expect(parseFeed(rss(items), url).articles).toHaveLength(100)
    expect(() => parseFeed(" ".repeat(2 * 1024 * 1024 + 1), url)).toThrow("2MB")
  })

  test("duplicate GUIDs cannot cause a multi-row upsert conflict", () => {
    const articles = parseFeed(rss(item("Old") + item("Updated")), url).articles
    expect(articles).toHaveLength(1)
    expect(articles[0]?.content).toBe("Updated")
  })

  test("rejects malformed XML, DTDs, entities, nesting and non-feeds", () => {
    for (const xml of [
      "<rss>",
      "<html/>",
      '<!DOCTYPE rss SYSTEM "file:///etc/passwd"><rss/>',
      '<!ENTITY x "boom"><rss/>',
      rss("<x>".repeat(70) + "</x>".repeat(70)),
    ]) {
      expect(() => parseFeed(xml, url)).toThrow()
    }
  })

  test("unsafe or missing article links are omitted", () => {
    for (const link of [
      "javascript:alert(1)",
      "file:///etc/passwd",
      "http://127.0.0.1/",
      "https://u:p@example.com/",
      "https://example.com:444/",
      "",
    ]) {
      expect(parseFeed(rss(item("text", link)), url).articles).toEqual([])
    }
  })
})

describe("SSRF guards", () => {
  test("blocks nonpublic IPv4 and IPv6 including mapped and transition ranges", () => {
    for (const ip of [
      "0.0.0.0",
      "10.1.2.3",
      "100.64.0.1",
      "127.0.0.1",
      "169.254.169.254",
      "172.16.0.1",
      "192.168.0.1",
      "192.0.0.8",
      "192.0.2.1",
      "198.18.0.1",
      "198.51.100.1",
      "203.0.113.1",
      "224.0.0.1",
      "255.255.255.255",
      "::",
      "::1",
      "::ffff:8.8.8.8",
      "fc00::1",
      "fe80::1",
      "ff02::1",
      "64:ff9b::808:808",
      "2001:db8::1",
      "2002:808:808::",
      "2001::1",
      "3fff::1",
      "bad",
    ]) {
      expect(isPublicAddress(ip)).toBe(false)
    }
    expect(isPublicAddress("8.8.8.8")).toBe(true)
    expect(isPublicAddress("2606:4700:4700::1111")).toBe(true)
  })

  test("URL parser normalizes obfuscated IPv4 before validation", () => {
    for (const input of [
      "http://2130706433",
      "http://0x7f000001",
      "http://127.1",
      "http://[::1]",
      "ftp://example.com",
      "https://u:p@example.com",
      "https://example.com:8080",
      "not a URL",
    ]) {
      expect(() => validateFeedUrl(input)).toThrow()
    }
    expect(validateFeedUrl("https://example.com:443/feed#part").href).toBe(url)
  })

  test("fetch rejects unsafe literal before any network access", () => {
    expect(fetchFeed("http://127.0.0.1/feed")).rejects.toThrow("Unsafe")
  })

  test("lookup returns only validated address, never a hostname to re-resolve", async () => {
    const pinned = createPinnedLookup((_hostname, _options, done) =>
      done(null, [{ address: "8.8.8.8", family: 4 }]),
    )
    await new Promise<void>((resolve, reject) => {
      pinned("example.com", {}, (error, address, family) => {
        if (error) return reject(error)
        expect(address).toBe("8.8.8.8")
        expect(family).toBe(4)
        resolve()
      })
    })
  })

  test("mixed public/private DNS answers fail closed", async () => {
    const pinned = createPinnedLookup((_hostname, _options, done) =>
      done(null, [
        { address: "8.8.8.8", family: 4 },
        { address: "127.0.0.1", family: 4 },
      ]),
    )
    await new Promise<void>((resolve) => {
      pinned("example.com", {}, (error) => {
        expect(error?.message).toBe("Unsafe feed DNS address")
        resolve()
      })
    })
  })
})
