import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"

import { Tabs, TabsList, TabsPanel, TabsTab } from "ui/tabs"

test("Yopem tabs render selected filter and active panel during SSR", () => {
  const html = renderToStaticMarkup(
    <Tabs value="unread">
      <TabsList aria-label="Article filters">
        <TabsTab value="all">All articles</TabsTab>
        <TabsTab value="unread">Unread</TabsTab>
      </TabsList>
      <TabsPanel value="all">All stories</TabsPanel>
      <TabsPanel value="unread">Unread stories</TabsPanel>
    </Tabs>,
  )

  expect(html).toContain('role="tablist"')
  expect(html).toContain('aria-selected="true"')
  expect(html).toContain('role="tabpanel"')
  expect(html).toContain("Unread stories")
  expect(html).not.toContain("All stories")
})

test("vertical tabs inherit list size, allow overrides and retain disabled semantics", () => {
  const html = renderToStaticMarkup(
    <Tabs defaultValue="all" orientation="vertical">
      <TabsList aria-label="Article filters" variant="underline" size="sm">
        <TabsTab value="all" id="all-tab" aria-controls="all-panel">
          All
        </TabsTab>
        <TabsTab value="saved" size="lg" disabled>
          Saved
        </TabsTab>
      </TabsList>
      <TabsPanel value="all" id="all-panel" aria-labelledby="all-tab">
        All stories
      </TabsPanel>
      <TabsPanel value="saved">Saved stories</TabsPanel>
    </Tabs>,
  )

  expect(html).toContain('aria-orientation="vertical"')
  expect(html).toMatch(/<button[^>]*data-size="sm"[^>]*>All<\/button>/)
  const disabledTab = html.match(/<button[^>]*data-size="lg"[^>]*>/)?.[0]

  expect(disabledTab).toContain('aria-disabled="true"')
  expect(html).toContain('aria-controls="')
  expect(html).toContain('aria-labelledby="')
  expect(html).toContain("All stories")
  expect(html).not.toContain("Saved stories")
})
