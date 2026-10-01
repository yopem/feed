import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"

import { Modal } from "ui/dialog"

function unexpectedChange() {
  throw new Error("SSR must not change dialog state")
}

test("closed modal does not mount portaled contents or invoke callbacks during SSR", () => {
  const html = renderToStaticMarkup(
    <Modal
      title="Follow a feed"
      description="Paste an RSS URL."
      open={false}
      onOpenChange={unexpectedChange}
      onOpenChangeComplete={unexpectedChange}
    >
      <input aria-label="Feed URL" />
    </Modal>,
  )

  expect(html).not.toContain("Follow a feed")
  expect(html).not.toContain("Paste an RSS URL.")
  expect(html).not.toContain("<input")
})
