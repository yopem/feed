import type React from "react"

import * as stylex from "@stylexjs/stylex"
import { Loader2Icon } from "lucide-react"

import type { StyleXComponentProps } from "ui/lib/stylex"
import { mergeStylexProps, stylexProps } from "ui/lib/stylex"

const spin = stylex.keyframes({
  to: { transform: "rotate(360deg)" },
})

const styles = stylex.create({
  root: {
    animationDuration: "1s",
    animationIterationCount: "infinite",
    animationName: spin,
    animationTimingFunction: "linear",
  },
})

export function Spinner({
  xstyle: consumerXstyle,
  className,
  "aria-label": label = "Loading",
  ...restProps
}: StyleXComponentProps<React.ComponentProps<typeof Loader2Icon>>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <output aria-label={label}>
      <Loader2Icon
        aria-hidden="true"
        data-slot="spinner"
        {...mergeStylexProps(
          stylexProps(className, styles.root, xstyle),
          props,
        )}
      />
    </output>
  )
}
