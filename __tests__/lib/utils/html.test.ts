import { sanitizeHtml, stripHtml } from "@/lib/utils/html"

describe("stripHtml", () => {
  it("returns empty string for null input", () => {
    expect(stripHtml(null)).toBe("")
  })

  it("returns empty string for undefined input", () => {
    expect(stripHtml(undefined)).toBe("")
  })

  it("returns empty string for empty string input", () => {
    expect(stripHtml("")).toBe("")
  })

  it("strips HTML tags from simple HTML", () => {
    expect(stripHtml("<p>Hello World</p>")).toBe("Hello World")
  })

  it("strips multiple HTML tags", () => {
    expect(stripHtml("<div><p>Hello</p> <span>World</span></div>")).toBe(
      "Hello World",
    )
  })

  it("strips self-closing tags", () => {
    expect(stripHtml("Hello<br/>World")).toBe("HelloWorld")
  })

  it("decodes HTML entities - &nbsp;", () => {
    expect(stripHtml("Hello&nbsp;World")).toBe("Hello World")
  })

  it("decodes HTML entities - &amp;", () => {
    expect(stripHtml("AT&amp;T")).toBe("AT&T")
  })

  it("decodes HTML entities - &lt; and &gt;", () => {
    expect(stripHtml("&lt;tag&gt;")).toBe("<tag>")
  })

  it("decodes HTML entities - &quot;", () => {
    expect(stripHtml("Say &quot;Hello&quot;")).toBe('Say "Hello"')
  })

  it("decodes HTML entities - &#039;", () => {
    expect(stripHtml("It&#039;s great")).toBe("It's great")
  })

  it("decodes HTML entities - &apos;", () => {
    expect(stripHtml("It&apos;s great")).toBe("It's great")
  })

  it("normalizes multiple whitespaces to single space", () => {
    expect(stripHtml("Hello    World")).toBe("Hello World")
  })

  it("trims leading and trailing whitespace", () => {
    expect(stripHtml("  Hello World  ")).toBe("Hello World")
  })

  it("handles complex HTML with entities and tags", () => {
    expect(
      stripHtml("<p>Hello&nbsp;&nbsp;<strong>World</strong>&amp;More</p>"),
    ).toBe("Hello World&More")
  })

  it("strips tags with attributes", () => {
    expect(stripHtml('<a href="https://example.com">Link</a>')).toBe("Link")
  })

  it("handles nested tags with whitespace", () => {
    expect(
      stripHtml("<div>  <p>  Hello  </p>  <span>  World  </span>  </div>"),
    ).toBe("Hello World")
  })
})

describe("sanitizeHtml", () => {
  it("returns empty string for null input", () => {
    expect(sanitizeHtml(null)).toBe("")
  })

  it("returns empty string for undefined input", () => {
    expect(sanitizeHtml(undefined)).toBe("")
  })

  it("returns empty string for empty string input", () => {
    expect(sanitizeHtml("")).toBe("")
  })

  it("removes script tags", () => {
    expect(sanitizeHtml("<script>alert('xss')</script>")).toBe("")
  })

  it("removes script tags with attributes", () => {
    expect(
      sanitizeHtml('<script type="text/javascript">alert("xss")</script>'),
    ).toBe("")
  })

  it("removes multiple script tags", () => {
    expect(
      sanitizeHtml(
        "<p>Hello</p><script>alert(1)</script><script>alert(2)</script>",
      ),
    ).toBe("<p>Hello</p>")
  })

  it("removes style tags", () => {
    expect(sanitizeHtml("<style>body { color: red; }</style>")).toBe("")
  })

  it("removes style tags with attributes", () => {
    expect(
      sanitizeHtml('<style type="text/css">body { color: red; }</style>'),
    ).toBe("")
  })

  it("removes inline event handlers with double quotes", () => {
    expect(sanitizeHtml('<div onclick="alert(1)">Click</div>')).toBe(
      "<div>Click</div>",
    )
  })

  it("removes inline event handlers with single quotes", () => {
    expect(sanitizeHtml("<div onclick='alert(1)'>Click</div>")).toBe(
      "<div>Click</div>",
    )
  })

  it("removes inline event handlers without quotes", () => {
    expect(sanitizeHtml("<div onclick=alert(1)>Click</div>")).toBe(
      "<div>Click</div>",
    )
  })

  it("removes various event handlers (onload, onmouseover, etc.)", () => {
    expect(sanitizeHtml('<img src="x" onload="alert(1)" />')).toBe(
      '<img src="x" />',
    )
    expect(sanitizeHtml('<div onmouseover="alert(1)">Hover</div>')).toBe(
      "<div>Hover</div>",
    )
    expect(sanitizeHtml('<body onload="alert(1)">Content</body>')).toBe(
      "<body>Content</body>",
    )
  })

  it("removes javascript: protocol from href", () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">Link</a>')).toBe(
      '<a href="#">Link</a>',
    )
  })

  it("removes javascript: protocol from href with single quotes", () => {
    expect(sanitizeHtml("<a href='javascript:alert(1)'>Link</a>")).toBe(
      '<a href="#">Link</a>',
    )
  })

  it("removes data: URIs from src attributes", () => {
    expect(sanitizeHtml('<img src="data:image/png;base64,abc123" />')).toBe(
      '<img src="" />',
    )
  })

  it("preserves safe HTML tags", () => {
    expect(sanitizeHtml("<p>Hello <strong>World</strong></p>")).toBe(
      "<p>Hello <strong>World</strong></p>",
    )
  })

  it("preserves safe attributes", () => {
    expect(sanitizeHtml('<a href="https://example.com">Link</a>')).toBe(
      '<a href="https://example.com">Link</a>',
    )
  })

  it("handles complex mixed content", () => {
    const input = `
      <div>
        <p>Safe content</p>
        <script>alert('xss')</script>
        <a href="https://example.com" onclick="alert(1)">Link</a>
        <img src="image.jpg" onload="alert(1)" />
      </div>
    `
    const result = sanitizeHtml(input)
    expect(result).toContain("<p>Safe content</p>")
    expect(result).toContain('<a href="https://example.com">Link</a>')
    expect(result).toContain('<img src="image.jpg" />')
    expect(result).not.toContain("script")
    expect(result).not.toContain("onclick")
    expect(result).not.toContain("onload")
  })

  it("removes case-insensitive script tags", () => {
    expect(sanitizeHtml("<SCRIPT>alert(1)</SCRIPT>")).toBe("")
    expect(sanitizeHtml("<ScRiPt>alert(1)</ScRiPt>")).toBe("")
  })

  it("removes case-insensitive style tags", () => {
    expect(sanitizeHtml("<STYLE>body {}</STYLE>")).toBe("")
    expect(sanitizeHtml("<StYlE>body {}</StYlE>")).toBe("")
  })

  it("removes case-insensitive event handlers", () => {
    expect(sanitizeHtml('<div ONCLICK="alert(1)">Click</div>')).toBe(
      "<div>Click</div>",
    )
    expect(sanitizeHtml('<div OnClick="alert(1)">Click</div>')).toBe(
      "<div>Click</div>",
    )
  })

  it("removes case-insensitive javascript: protocol", () => {
    expect(sanitizeHtml('<a href="JavaScript:alert(1)">Link</a>')).toBe(
      '<a href="#">Link</a>',
    )
    expect(sanitizeHtml('<a href="JAVASCRIPT:alert(1)">Link</a>')).toBe(
      '<a href="#">Link</a>',
    )
  })
})
