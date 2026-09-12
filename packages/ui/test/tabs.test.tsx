import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"

import { Tabs, TabsList, TabsPanel, TabsTab } from "ui/tabs"

test("coss tabs render selected filter and active panel during SSR", () => {
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
