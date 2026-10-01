import { expect, test } from "bun:test"
import { safeRedirect, trustedOrigin } from "server/lib/security"

test("origins must exactly match and redirects stay local", () => {
  expect(trustedOrigin("https://feed.example", "https://feed.example")).toBe(
    true,
  )

  for (const origin of [
    undefined,
    "null",
    "https://evil.example",
    "https://feed.example.evil",
  ]) {
    expect(trustedOrigin(origin, "https://feed.example")).toBe(false)
  }

  for (const path of [
    "//evil.example",
    "/\\evil.example",
    "https://evil.example",
  ]) {
    expect(safeRedirect(path, "https://feed.example")).toBe(
      "https://feed.example/",
    )
  }
})
