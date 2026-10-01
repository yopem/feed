import * as stylex from "@stylexjs/stylex"
import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"

import { Button } from "ui/button"

const styles = stylex.create({ override: { opacity: 0.5, inlineSize: "100%" } })

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
  expect(html).toContain('<output aria-label="Loading"')
  expect(html).toContain('data-slot="button-loading-indicator"')
  expect(html).toContain('aria-hidden="true"')
  expect(html).toContain("Save")
})

test("render composition preserves native link semantics", () => {
  const html = renderToStaticMarkup(
    <Button render={<a href="/auth/login" aria-label="Continue with Google" />}>
      Continue with Google
    </Button>,
  )

  expect(html).toStartWith("<a ")
  expect(html).toContain('href="/auth/login"')
  expect(html).not.toContain('type="button"')
  expect(html).not.toContain("disabled=")
})

test("button variants retain outline default and allow StyleX overrides", () => {
  const implicit = renderToStaticMarkup(<Button>Save</Button>)
  const outline = renderToStaticMarkup(<Button variant="outline">Save</Button>)
  const solid = renderToStaticMarkup(<Button variant="default">Save</Button>)

  const customized = renderToStaticMarkup(
    <Button variant="outline" size="icon-sm" xstyle={styles.override}>
      Save
    </Button>,
  )

  expect(implicit).toBe(outline)
  expect(implicit).not.toBe(solid)
  const overrideClassName = stylex.props(styles.override).className

  if (!overrideClassName) throw new Error("StyleX override was not compiled")

  expect(customized).toContain(overrideClassName)
  expect(customized).not.toContain("xstyle=")
})

test("explicit disabled and loading cannot accidentally enable submission", () => {
  const html = renderToStaticMarkup(
    <Button loading disabled={false} type="submit">
      Save
    </Button>,
  )

  expect(html).toContain('disabled=""')
  expect(html).toContain('type="submit"')
  expect(renderToStaticMarkup(<Button disabled>Save</Button>)).toContain(
    'disabled=""',
  )
})
