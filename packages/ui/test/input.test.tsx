import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"

import { Input } from "ui/input"

test("input keeps form labels, values, and validation on the native control", () => {
  const html = renderToStaticMarkup(
    <Input
      id="feed-url"
      type="url"
      defaultValue="https://example.com/feed"
      aria-invalid
      aria-describedby="feed-error"
    />,
  )

  expect(html).toContain('data-slot="input-control"')
  expect(html).toMatch(/<input[^>]*id="feed-url"/)
  expect(html).toMatch(/<input[^>]*aria-invalid="true"/)
  expect(html).toMatch(/<input[^>]*aria-describedby="feed-error"/)
  expect(html).toContain('value="https://example.com/feed"')
})
