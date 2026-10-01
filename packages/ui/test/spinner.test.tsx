import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"

import { Spinner } from "ui/spinner"

test("spinner retains native status semantics and hides its decorative icon", () => {
  const html = renderToStaticMarkup(<Spinner data-slot="loading-feeds" />)

  expect(html).toStartWith('<output aria-label="Loading"')
  expect(html).toContain('data-slot="loading-feeds"')
  expect(html).toMatch(/<svg[^>]*aria-hidden="true"/)
  expect(html).not.toContain('role="status"')
})
