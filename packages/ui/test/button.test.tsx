import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"

import { Button } from "ui/button"

test("buttons default to non-submit and preserve explicit submit behavior", () => {
  expect(renderToStaticMarkup(<Button>Follow</Button>)).toContain(
    'type="button"',
  )
  expect(renderToStaticMarkup(<Button type="submit">Save</Button>)).toContain(
    'type="submit"',
  )
})

test("loading buttons disable submission and expose status", () => {
  const html = renderToStaticMarkup(<Button loading>Save</Button>)
  expect(html).toContain('disabled=""')
  expect(html).toContain('aria-disabled="true"')
  expect(html).toContain('role="status"')
})

test("render composition preserves native link semantics", () => {
  const html = renderToStaticMarkup(
    <Button render={<a href="/auth/login" />}>Continue with Google</Button>,
  )

  expect(html).toStartWith("<a ")
  expect(html).toContain('href="/auth/login"')
  expect(html).not.toContain('type="button"')
})
