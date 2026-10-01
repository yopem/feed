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
