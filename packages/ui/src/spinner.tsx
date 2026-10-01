import type React from "react"

import * as stylex from "@stylexjs/stylex"
import { Loader2Icon } from "lucide-react"

import type { StyleXComponentProps } from "ui/lib/stylex"
import { stylexProps } from "ui/lib/stylex"

const spin = stylex.keyframes({
  to: { transform: "rotate(360deg)" },
})

const styles = stylex.create({
  container: {
    blockSize: "1em",
    display: "inline-flex",
    inlineSize: "1em",
  },
  root: {
    blockSize: "100%",
    inlineSize: "100%",
    animationDuration: "1s",
    animationIterationCount: "infinite",
    animationName: spin,
    animationTimingFunction: "linear",
  },
})

export function Spinner({
  xstyle: consumerXstyle,
  className,
  "data-slot": dataSlot = "spinner",
  ...restProps
}: StyleXComponentProps<
  React.ComponentProps<typeof Loader2Icon>,
  { "data-slot"?: string }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <output
      aria-label="Loading"
      data-slot={dataSlot}
      {...stylexProps(className, styles.container, xstyle)}
    >
      <Loader2Icon
        {...stylex.props(styles.root)}
        {...props}
        aria-hidden="true"
      />
    </output>
  )
}
