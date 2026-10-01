import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"

import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "ui/dialog"

function unexpectedChange() {
  throw new Error("SSR must not change dialog state")
}

test("closed dialog does not mount portaled contents or invoke callbacks during SSR", () => {
  const html = renderToStaticMarkup(
    <Dialog
      open={false}
      onOpenChange={unexpectedChange}
      onOpenChangeComplete={unexpectedChange}
    >
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Follow a feed</DialogTitle>
          <DialogDescription>Paste an RSS URL.</DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <input aria-label="Feed URL" />
        </DialogPanel>
      </DialogPopup>
    </Dialog>,
  )

  expect(html).not.toContain("Follow a feed")
  expect(html).not.toContain("Paste an RSS URL.")
  expect(html).not.toContain("<input")
})
