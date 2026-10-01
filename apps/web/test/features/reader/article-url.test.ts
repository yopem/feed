import { expect, test } from "bun:test"
import { articleUrl } from "web/features/reader/article-url"

test("article links allow only absolute HTTP URLs", () => {
  expect(articleUrl("https://example.com/story")).toBe(
    "https://example.com/story",
  )
  expect(articleUrl("http://example.com/story")).toBe(
    "http://example.com/story",
  )

  for (const unsafe of [
    "javascript:alert(1)",
    "data:text/html,test",
    "/relative",
    "broken",
    "",
  ]) {
    expect(articleUrl(unsafe)).toBeNull()
  }
})
