import type { LookupAddress } from "node:dns"
import type { LookupFunction } from "node:net"

import { XMLParser, XMLValidator } from "fast-xml-parser"
import { lookup } from "node:dns"
import { request as httpRequest } from "node:http"
import { request as httpsRequest } from "node:https"
import { BlockList, isIP } from "node:net"
import { z } from "zod"

const maxBytes = 2 * 1024 * 1024

const blocked = new BlockList()

for (const [address, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.31.196.0", 24],
  ["192.52.193.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["192.175.48.0", 24],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 3],
] satisfies [string, number][]) {
  blocked.addSubnet(address, prefix, "ipv4")
}

for (const [address, prefix] of [
  ["2001::", 23],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["3fff::", 20],
  ["2620:4f:8000::", 48],
] satisfies [string, number][]) {
  blocked.addSubnet(address, prefix, "ipv6")
}

const globalV6 = new BlockList()

globalV6.addSubnet("2000::", 3, "ipv6")

export function isPublicAddress(address: string) {
  const family = isIP(address)

  if (family === 4) return !blocked.check(address, "ipv4")

  return (
    family === 6 &&
    !address.includes("%") &&
    globalV6.check(address, "ipv6") &&
    !blocked.check(address, "ipv6")
  )
}

export function validateFeedUrl(input: string) {
  const url = new URL(input)
  const hostname = url.hostname.replace(/^\[|\]$/g, "")

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    (url.port && !["80", "443"].includes(url.port)) ||
    !hostname ||
    (isIP(hostname) && !isPublicAddress(hostname))
  ) {
    throw new Error("Unsafe feed URL")
  }

  url.hash = ""

  return url
}

export function createPinnedLookup(
  resolve: (
    hostname: string,
    options: { all: true; verbatim: true },
    done: (
      error: NodeJS.ErrnoException | null,
      addresses: LookupAddress[],
    ) => void,
  ) => void = lookup,
) {
  const pinnedLookup: LookupFunction = (hostname, _options, callback) => {
    resolve(hostname, { all: true, verbatim: true }, (error, addresses) => {
      if (error) {
        callback(new Error("Feed DNS lookup failed"), "", 4)

        return
      }

      const first = addresses[0]

      if (
        !first ||
        addresses.some(({ address }) => !isPublicAddress(address))
      ) {
        callback(new Error("Unsafe feed DNS address"), "", 4)

        return
      }

      callback(null, first.address, first.family)
    })
  }

  return pinnedLookup
}

const xmlValueSchema = z.json()

const xmlRecordSchema = z.record(z.string(), xmlValueSchema)

const xmlStringSchema = z.string()

type XmlValue = z.infer<typeof xmlValueSchema>

type XmlRecord = z.infer<typeof xmlRecordSchema>

function record(value: XmlValue | undefined): XmlRecord {
  const parsed = xmlRecordSchema.safeParse(value)

  return parsed.success ? parsed.data : {}
}

function list(value: XmlValue | undefined) {
  return Array.isArray(value) ? value : value === undefined ? [] : [value]
}

function text(value: XmlValue | undefined) {
  const directText = xmlStringSchema.safeParse(value)

  if (directText.success) return directText.data

  const content = xmlStringSchema.safeParse(record(value)["#text"])

  return content.success ? content.data : ""
}

const fragmentParser = new XMLParser({
  preserveOrder: true,
  ignoreAttributes: true,
  parseTagValue: false,
  processEntities: true,
  htmlEntities: true,
  unpairedTags: ["br", "hr", "img", "input", "meta", "link", "wbr"],
})

function extractText(value: XmlValue | undefined, depth = 0): string {
  if (depth > 64) throw new Error("Feed markup too deeply nested")

  const directText = xmlStringSchema.safeParse(value)

  if (directText.success) return directText.data

  if (Array.isArray(value)) {
    return value.map((item) => extractText(item, depth + 1)).join(" ")
  }

  return Object.entries(record(value))
    .filter(
      ([key]) =>
        !key.startsWith("@") &&
        !["script", "style", "iframe", "object"].includes(key.toLowerCase()),
    )
    .map(([, item]) => extractText(item, depth + 1))
    .join(" ")
}

function plainText(value: XmlValue | undefined) {
  const directText = xmlStringSchema.safeParse(value)
  const source = directText.success ? directText.data : extractText(value)

  if (/<!\s*(DOCTYPE|ENTITY)/i.test(source)) {
    throw new Error("Feed DTDs and entities are forbidden")
  }

  // Never return markup, including markup produced by entity decoding.
  const parsed = xmlValueSchema.parse(
    fragmentParser.parse(`<root>${source}</root>`),
  )

  return extractText(parsed)
    .replace(/<[^>]*>/g, " ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function articleUrl(value: string, base: string) {
  if (!value.trim()) return ""

  try {
    return validateFeedUrl(new URL(value, base).href).href
  } catch {
    return ""
  }
}

export function parseFeed(xml: string, url: string) {
  const feedUrl = validateFeedUrl(url).href

  if (Buffer.byteLength(xml) > maxBytes) throw new Error("Feed exceeds 2MB")

  if (/<!\s*(DOCTYPE|ENTITY)/i.test(xml)) {
    throw new Error("Feed DTDs and entities are forbidden")
  }

  // Bound nesting before the parser builds a recursive object tree.
  let depth = 0

  for (const match of xml.matchAll(
    /<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->|<(?:[^"'<>]|"[^"]*"|'[^']*')*>/g,
  )) {
    const tag = match[0]

    if (tag.startsWith("<!") || tag.startsWith("<?")) continue

    if (tag.startsWith("</")) depth--
    else if (!tag.endsWith("/>")) depth++

    if (depth > 64) throw new Error("Feed XML too deeply nested")
  }

  if (XMLValidator.validate(xml) !== true) throw new Error("Malformed feed XML")

  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    parseTagValue: false,
    parseAttributeValue: false,
    processEntities: true,
    htmlEntities: true,
    trimValues: false,
    stopNodes: ["*.div"],
  })

  const root = xmlRecordSchema.parse(parser.parse(xml))
  const atom = root.feed !== undefined
  const channel = record(atom ? root.feed : record(root.rss).channel)

  if ((!atom && !root.rss) || Object.keys(channel).length === 0) {
    throw new Error("Expected RSS or Atom feed")
  }

  const articles = list(atom ? channel.entry : channel.item)
    .slice(0, 100)
    .flatMap((value) => {
      const item = record(value)

      const link = atom
        ? list(item.link)
            .map(record)
            .find(
              (candidate) =>
                !candidate["@_rel"] || candidate["@_rel"] === "alternate",
            )?.["@_href"]
        : item.link

      const href = articleUrl(text(link), feedUrl)

      if (!href) return []

      const date = new Date(
        text(atom ? (item.published ?? item.updated) : item.pubDate),
      )

      return [
        {
          guid: plainText(item.guid ?? item.id) || href,
          title: plainText(item.title) || href,
          url: href,
          content: plainText(
            item.encoded ?? item.content ?? item.description ?? item.summary,
          ),
          publishedAt: Number.isNaN(date.getTime()) ? null : date,
        },
      ]
    })

  return {
    title: plainText(channel.title) || feedUrl,
    url: feedUrl,
    articles: Array.from(
      new Map(articles.map((article) => [article.guid, article])).values(),
    ),
  }
}

function requestFeed(url: URL, signal: AbortSignal) {
  return new Promise<{ xml: string; location?: string }>((resolve, reject) => {
    const request = url.protocol === "https:" ? httpsRequest : httpRequest

    const options = {
      agent: false,
      autoSelectFamily: false,
      lookup: createPinnedLookup(),
      signal,
      maxHeaderSize: 16 * 1024,
      headers: {
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml",
        "Accept-Encoding": "identity",
        "User-Agent": "Feed-RSS/1.0",
      },
    }

    const req = request(url, options, (response) => {
      response.on("error", reject)
      const status = response.statusCode ?? 0

      if ([301, 302, 303, 307, 308].includes(status)) {
        const location = response.headers.location
        response.destroy()

        if (!location) reject(new Error("Feed redirect missing location"))
        else resolve({ xml: "", location })

        return
      }

      if (status < 200 || status >= 300) {
        response.destroy()
        reject(new Error("Feed request failed"))

        return
      }

      if (
        response.headers["content-encoding"] &&
        response.headers["content-encoding"] !== "identity"
      ) {
        response.destroy()
        reject(new Error("Compressed feeds are not supported"))

        return
      }

      let size = 0
      const chunks: Buffer[] = []
      response.on("data", (chunk: Buffer) => {
        size += chunk.length

        if (size > maxBytes) {
          req.destroy(new Error("Feed exceeds 2MB"))

          return
        }

        chunks.push(chunk)
      })
      response.on("end", () =>
        resolve({ xml: Buffer.concat(chunks).toString("utf8") }),
      )
      response.on("aborted", () => reject(new Error("Feed response aborted")))
    })

    req.on("error", reject)
    req.end()
  })
}

export async function fetchFeed(url: string) {
  let target = validateFeedUrl(url)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    for (let redirects = 0; redirects <= 3; redirects++) {
      const response = await requestFeed(target, controller.signal)

      if (!response.location) return parseFeed(response.xml, target.href)
      target = validateFeedUrl(new URL(response.location, target).href)
    }

    throw new Error("Too many feed redirects")
  } finally {
    clearTimeout(timeout)
  }
}
