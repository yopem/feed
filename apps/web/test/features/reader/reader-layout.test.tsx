import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { Reader } from "web/features/reader/reader"
import { WorkspaceReader } from "web/features/reader/workspace-reader"

import type { Article } from "rpc/reader"

const article: Article = {
  id: "article-1",
  feedId: "feed-1",
  feedTitle: "Independent source",
  title: "A story worth reading",
  content: "The article excerpt.",
  url: "https://example.com/story",
  publishedAt: "2026-06-01T10:00:00.000Z",
  read: false,
  starred: true,
  saved: true,
}

function ignoreAction() {
  throw new Error("Static rendering must not invoke actions")
}

test("reader composes coss filters, semantic article rows and viewer permissions", () => {
  const cache = new QueryClient()
  cache.setQueryData(["workspace", "workspace-1", "feeds"], [])
  cache.setQueryData(
    [
      "workspace",
      "workspace-1",
      "articles",
      { workspaceId: "workspace-1", view: "all" },
    ],
    [article],
  )
  const workspace = {
    id: "workspace-1",
    name: "Personal",
    role: "viewer" as const,
  }
  const html = renderToStaticMarkup(
    <QueryClientProvider client={cache}>
      <WorkspaceReader
        name="Reader"
        workspace={workspace}
        workspaces={[workspace]}
        onSwitch={ignoreAction}
        onCreate={ignoreAction}
      />
    </QueryClientProvider>,
  )
  expect(html).toContain('role="tablist"')
  expect(html).toContain('aria-label="Article filters"')
  expect(html).toContain('role="tabpanel"')
  expect(html).toContain('<ul class="article-rows">')
  expect(html).toContain("A story worth reading")
  expect(html).toContain('aria-label="Starred"')
  expect(html).toContain('aria-label="Saved for later"')
  expect(html).toContain('dateTime="2026-06-01T10:00:00.000Z"')
  expect(html).not.toContain("Follow a feed")
  expect(html).toContain("View-only workspace")
  cache.clear()
})

test("signed-out reader uses coss authentication card and real sign-in link", () => {
  const cache = new QueryClient()
  cache.setQueryData(["session"], { user: null })
  const html = renderToStaticMarkup(
    <QueryClientProvider client={cache}>
      <Reader />
    </QueryClientProvider>,
  )
  expect(html).toContain('data-slot="card"')
  expect(html).toContain("/auth/login")
  expect(html).toContain("Continue with Google")
  cache.clear()
})

test("first workspace setup uses named form and coss card", () => {
  const cache = new QueryClient()
  cache.setQueryData(["session"], { user: { id: "user-1", name: "Reader" } })
  cache.setQueryData(["workspaces"], [])
  const html = renderToStaticMarkup(
    <QueryClientProvider client={cache}>
      <Reader />
    </QueryClientProvider>,
  )
  expect(html).toContain('data-slot="card"')
  expect(html).toContain("Create your reading space")
  expect(html).toContain("Workspace name")
  expect(html).toContain('type="submit"')
  cache.clear()
})
