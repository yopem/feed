import { expect, test } from "bun:test"
import { formatArticleDate } from "web/features/reader/format-date"

test("article dates use a stable timezone and handle invalid values", () => {
  expect(formatArticleDate("2026-01-01T23:00:00-04:00")).toBe("Jan 2, 2026")
  expect(formatArticleDate("invalid")).toBe("Unknown date")
})
