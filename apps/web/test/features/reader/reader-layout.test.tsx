import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { FeedToolbar } from "web/features/reader/feed-toolbar"
import { Reader } from "web/features/reader/reader"
import { WorkspaceReader } from "web/features/reader/workspace-reader"

import type { Article, Workspace } from "rpc/reader"
import { ThemeProvider } from "ui/theme/theme-provider"

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

test("reader composes Yopem filters, semantic article rows and viewer permissions", () => {
  const cache = new QueryClient()
  cache.setQueryData(["workspace", "workspace-1", "feeds"], [])
  cache.setQueryData(
    [
      "workspace",
      "workspace-1",
      "articles",
      { workspaceId: "workspace-1", view: "all" },
    ],
    [
      article,
      {
        ...article,
        id: "article-2",
        title: "",
        read: true,
        starred: false,
        saved: false,
      },
    ],
  )

  const workspace = {
    id: "workspace-1",
    name: "Personal",
    role: "viewer" as const,
  }

  const html = renderToStaticMarkup(
    <QueryClientProvider client={cache}>
      <ThemeProvider>
        <WorkspaceReader
          name="Reader"
          workspace={workspace}
          workspaces={[workspace]}
          onSwitch={ignoreAction}
          onCreate={ignoreAction}
        />
      </ThemeProvider>
    </QueryClientProvider>,
  )

  expect(html).toContain('role="tablist"')
  expect(html).toContain('aria-label="Article filters"')
  expect(html).toContain('role="tabpanel"')
  expect(html).toMatch(/<ul(?:\s[^>]*)?>\s*<li\b/)
  expect(html).toContain(
    'aria-label="A story worth reading. Independent source. Unread"',
  )
  expect(html).toContain(
    'aria-label="Untitled article. Independent source. Read"',
  )
  expect(html).toMatch(/<button\b[^>]*type="button"[^>]*aria-label="A story/)
  expect(html).toContain('href="#reading-list"')
  expect(html).toContain('id="reading-list"')
  expect(html).toMatch(/<main\b[^>]*id="reading-list"[^>]*tabindex="-1"/)
  expect(html).toContain('aria-label="Open navigation"')
  expect(html).toContain('aria-label="Search articles"')
  expect(html).toContain('type="search"')
  expect(html).toContain('aria-label="Reading views"')
  expect(html).toContain('aria-label="Feeds"')
  expect(html).toContain('aria-current="page"')
  expect(html).toContain('aria-live="polite"')
  expect(html).toContain('aria-label="Starred"')
  expect(html).toContain('aria-label="Saved for later"')
  expect(html).toContain('dateTime="2026-06-01T10:00:00.000Z"')
  expect(html).not.toContain("Follow a feed")
  expect(html).not.toContain('aria-label="Add feed"')
  expect(html).toContain("View-only workspace")
  cache.clear()
})

test.each(["owner", "editor"] as const)(
  "%s can follow feeds and access empty-list setup",
  (role) => {
    const cache = new QueryClient()
    const workspace: Workspace = { id: "workspace-1", name: "Personal", role }
    cache.setQueryData(["workspace", workspace.id, "feeds"], [])
    cache.setQueryData(
      [
        "workspace",
        workspace.id,
        "articles",
        { workspaceId: workspace.id, view: "all" },
      ],
      [],
    )

    const html = renderToStaticMarkup(
      <QueryClientProvider client={cache}>
        <ThemeProvider>
          <WorkspaceReader
            name="Reader"
            workspace={workspace}
            workspaces={[workspace]}
            onSwitch={ignoreAction}
            onCreate={ignoreAction}
          />
        </ThemeProvider>
      </QueryClientProvider>,
    )

    expect(html).toContain("Follow a feed")
    expect(html).toContain('aria-label="Add feed"')
    expect(html).toContain("Add your first feed")
    expect(html).not.toContain("View-only workspace")

    cache.clear()
  },
)

test.each(["owner", "editor", "viewer"] as const)(
  "feed toolbar preserves %s permissions and refresh errors",
  (role) => {
    const cache = new QueryClient()

    const html = renderToStaticMarkup(
      <QueryClientProvider client={cache}>
        <ThemeProvider>
          <FeedToolbar
            workspace={{ id: "workspace-1", name: "Personal", role }}
            feed={{
              id: "feed-1",
              title: "Independent source",
              url: "https://example.com/feed.xml",
              lastFetchedAt: "2026-06-01T10:00:00.000Z",
              error: "Source unavailable",
            }}
            onRemoved={ignoreAction}
          />
        </ThemeProvider>
      </QueryClientProvider>,
    )

    expect(html).toContain("Last refreshed Jun 1, 2026")
    expect(html).toContain('role="alert"')
    expect(html).toContain("Feed refresh failed: Source unavailable")

    if (role === "viewer") {
      expect(html).not.toContain('aria-label="Remove Independent source"')
      expect(html).not.toMatch(/>Refresh<\/button>/)
    } else {
      expect(html).toContain('aria-label="Remove Independent source"')
      expect(html).toMatch(/>Refresh<\/button>/)
    }

    cache.clear()
  },
)

test("signed-out reader uses Yopem authentication card and real sign-in link", () => {
  const cache = new QueryClient()
  cache.setQueryData(["session"], { user: null })

  const html = renderToStaticMarkup(
    <QueryClientProvider client={cache}>
      <ThemeProvider>
        <Reader />
      </ThemeProvider>
    </QueryClientProvider>,
  )

  expect(html).toContain('data-slot="card"')
  expect(html).toMatch(/<a\b[^>]*href="[^"]*\/auth\/login"[^>]*>/)
  expect(html).toContain('aria-label="Continue with Google"')
  expect(html).toContain("Welcome to Feed")
  cache.clear()
})

test("first workspace setup uses named form and Yopem card", () => {
  const cache = new QueryClient()
  cache.setQueryData(["session"], { user: { id: "user-1", name: "Reader" } })
  cache.setQueryData(["workspaces"], [])

  const html = renderToStaticMarkup(
    <QueryClientProvider client={cache}>
      <ThemeProvider>
        <Reader />
      </ThemeProvider>
    </QueryClientProvider>,
  )

  expect(html).toContain('data-slot="card"')
  expect(html).toContain("Create your reading space")
  expect(html).toMatch(/<label\b[^>]*for="[^"]+">Workspace name<\/label>/)
  expect(html).toContain('placeholder="My reading space"')
  expect(html).toContain('aria-current="step"')
  expect(html).toContain('type="submit"')
  expect(html).toContain("Create workspace")
  cache.clear()
})
