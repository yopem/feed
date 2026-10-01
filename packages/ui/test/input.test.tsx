import * as stylex from "@stylexjs/stylex"
import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"

import { Input } from "ui/input"

const styles = stylex.create({ wrapper: { maxInlineSize: "20rem" } })

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

test("StyleX customization stays on the input wrapper", () => {
  const html = renderToStaticMarkup(
    <Input xstyle={styles.wrapper} type="search" aria-label="Search" />,
  )

  expect(html).toMatch(
    new RegExp(
      `<span[^>]*class="[^"]*${stylex.props(styles.wrapper).className}`,
    ),
  )
  expect(html).not.toContain("xstyle=")
})

test("native and unstyled inputs preserve size, disabled and form semantics", () => {
  const html = renderToStaticMarkup(
    <Input
      nativeInput
      unstyled
      size={24}
      name="title"
      defaultValue="Feed"
      disabled
    />,
  )

  expect(html).toMatch(/<input[^>]*size="24"/)
  expect(html).toMatch(/<input[^>]*name="title"/)
  expect(html).toMatch(/<input[^>]*disabled=""/)
  expect(html).toContain('value="Feed"')
  expect(renderToStaticMarkup(<Input size="sm" />)).not.toMatch(
    /<input[^>]*size="sm"/,
  )
})
