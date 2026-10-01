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

test("spinner places custom accessible label on the status element", () => {
  const html = renderToStaticMarkup(<Spinner aria-label="Refreshing feeds" />)

  expect(html).toStartWith('<output aria-label="Refreshing feeds"')
  expect(html).not.toMatch(/<svg[^>]*aria-label=/)
  expect(html).toMatch(/<svg[^>]*aria-hidden="true"/)
})
