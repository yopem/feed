import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"

import { Select, SelectTrigger, SelectValue } from "ui/select"

test("workspace select renders its label during SSR, not its internal ID", () => {
  const html = renderToStaticMarkup(
    <Select
      defaultValue="workspace-1"
      items={[{ value: "workspace-1", label: "Daily reading" }]}
    >
      <SelectTrigger aria-label="Workspace">
        <SelectValue />
      </SelectTrigger>
    </Select>,
  )

  expect(html).toContain('role="combobox"')
  expect(html).toContain('aria-label="Workspace"')
  expect(html).toContain(">Daily reading</span>")
})

test("empty selects expose placeholder, accessible name and disabled state", () => {
  const html = renderToStaticMarkup(
    <Select items={[{ value: "one", label: "One" }]} disabled>
      <SelectTrigger aria-label="Workspace">
        <SelectValue placeholder="Choose a workspace" />
      </SelectTrigger>
    </Select>,
  )

  expect(html).toContain("Choose a workspace")
  expect(html).toContain('aria-label="Workspace"')
  expect(html).toContain('disabled=""')
  expect(html).toContain('aria-expanded="false"')
})

test("controlled select preserves hidden native form value during SSR", () => {
  const html = renderToStaticMarkup(
    <Select
      name="workspace"
      value="workspace-1"
      items={[{ value: "workspace-1", label: "Daily reading" }]}
    >
      <SelectTrigger aria-label="Workspace">
        <SelectValue />
      </SelectTrigger>
    </Select>,
  )

  expect(html).toContain(">Daily reading</span>")
  expect(html).toMatch(/<input[^>]*name="workspace"/)
  expect(html).toMatch(/<input[^>]*value="workspace-1"/)
})
