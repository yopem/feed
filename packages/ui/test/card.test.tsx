import * as stylex from "@stylexjs/stylex"
import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "ui/card"

const styles = stylex.create({ card: { maxInlineSize: "24rem" } })

test("cards retain section slots, render composition and StyleX customization", () => {
  const html = renderToStaticMarkup(
    <Card render={<section aria-label="Sign in" />} xstyle={styles.card}>
      <CardHeader>
        <CardTitle>
          <h2>Welcome</h2>
        </CardTitle>
        <CardDescription>Sign in to read.</CardDescription>
      </CardHeader>
      <CardPanel>Continue with Google</CardPanel>
      <CardFooter>Public signup</CardFooter>
    </Card>,
  )

  expect(html).toStartWith("<section ")
  expect(html).toContain('aria-label="Sign in"')
  const cardClassName = stylex.props(styles.card).className

  if (!cardClassName) throw new Error("StyleX card was not compiled")

  expect(html).toContain(cardClassName)

  for (const slot of [
    "card",
    "card-header",
    "card-title",
    "card-description",
    "card-panel",
    "card-footer",
  ])
    expect(html).toContain(`data-slot="${slot}"`)
  expect(html).toContain("<h2>Welcome</h2>")
})
