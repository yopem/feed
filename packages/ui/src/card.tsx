"use client"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import * as stylex from "@stylexjs/stylex"

import type { StyleXComponentProps } from "ui/lib/stylex"
import { stylexProps } from "ui/lib/stylex"
import { themeMarker, tokens } from "ui/styles/tokens.stylex"

const styles = stylex.create({
  card: {
    backgroundClip: "padding-box",
    backgroundColor: tokens["--card"],
    borderColor: tokens["--border"],
    borderRadius: "1rem",
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "var(--button-outline-shadow)",
    color: tokens["--card-foreground"],
    display: "flex",
    flexDirection: "column",
    position: "relative",
    "::before": {
      borderRadius: "calc(1rem - 1px)",
      boxShadow: {
        default: "var(--button-outline-inset-shadow)",
        [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
          "var(--button-outline-inset-shadow-dark)",
      },
      content: '""',
      inset: 0,
      pointerEvents: "none",
      position: "absolute",
    },
    margin: {
      default: null,
      ':is([data-slot="card-frame"] > [data-slot="card"])': "-1px",
    },
  },
  frame: {
    backgroundColor: tokens["--card"],
    borderColor: tokens["--border"],
    borderRadius: "1rem",
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "var(--button-outline-shadow)",
    color: tokens["--card-foreground"],
    display: "flex",
    flexDirection: "column",
    position: "relative",
    "::before": {
      backgroundColor:
        "color-mix(in oklab, var(--muted, transparent) 72%, transparent)",
      borderRadius: "calc(1rem - 1px)",
      boxShadow: {
        default: "var(--button-outline-inset-shadow)",
        [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
          "var(--button-outline-inset-shadow-dark)",
      },
      content: '""',
      inset: 0,
      pointerEvents: "none",
      position: "absolute",
    },
    overflow: {
      default: null,
      ':has([data-slot="table-container"])': "hidden",
    },
  },
  frameHeader: {
    alignItems: "start",
    columnGap: "1rem",
    display: "grid",
    gridAutoRows: "min-content",
    gridTemplateRows: "auto auto",
    paddingBlock: "1rem",
    paddingInline: "1.5rem",
    position: "relative",
    gridTemplateColumns: {
      default: null,
      ':has([data-slot="card-frame-action"])': "1fr auto",
    },
  },
  frameTitle: {
    alignSelf: "center",
    fontSize: "0.875rem",
    fontWeight: 600,
  },
  frameDescription: {
    alignSelf: "center",
    color: tokens["--muted-foreground"],
    fontSize: "0.875rem",
  },
  frameAction: {
    alignSelf: "center",
    display: "inline-flex",
    gridColumnStart: "2",
    justifySelf: "end",
  },
  frameFooter: {
    paddingBlock: "1rem",
    paddingInline: "1.5rem",
  },
  header: {
    alignItems: "start",
    display: "grid",
    gap: "0.375rem",
    gridAutoRows: "min-content",
    gridTemplateRows: "auto auto",
    padding: "1.5rem",
    gridTemplateColumns: {
      default: null,
      ':has([data-slot="card-action"])': "1fr auto",
    },
    paddingBlockEnd: {
      default: "1.5rem",
      ':is([data-slot="card"]:has(> [data-slot="card-panel"]) > [data-slot="card-header"])':
        "1rem",
    },
  },
  title: {
    fontFamily: tokens["--font-heading"],
    fontSize: "1.125rem",
    fontWeight: 600,
    lineHeight: 1,
  },
  description: {
    color: tokens["--muted-foreground"],
    fontSize: "0.875rem",
  },
  action: {
    alignSelf: "start",
    display: "inline-flex",
    gridColumnStart: "2",
    gridRow: "1 / span 2",
    justifySelf: "end",
  },
  panel: {
    flex: 1,
    padding: "1.5rem",
    paddingBlockStart: {
      default: "1.5rem",
      ':is([data-slot="card"]:has(> [data-slot="card-header"]:not([data-separator])) > [data-slot="card-panel"])': 0,
    },
    paddingBlockEnd: {
      default: "1.5rem",
      ':is([data-slot="card"]:has(> [data-slot="card-footer"]:not([data-separator])) > [data-slot="card-panel"])': 0,
    },
  },
  footer: {
    alignItems: "center",
    display: "flex",
    padding: "1.5rem",
    paddingBlockStart: {
      default: "1.5rem",
      ':is([data-slot="card"]:has(> [data-slot="card-panel"]) > [data-slot="card-footer"])':
        "1rem",
    },
  },
  headerSeparator: {
    borderBlockEndWidth: 1,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: tokens["--border"],
  },
  footerSeparator: {
    borderBlockStartWidth: 1,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: tokens["--border"],
  },
})

export function Card({
  xstyle: consumerXstyle,
  className,
  render,
  ...restProps
}: StyleXComponentProps<useRender.ComponentProps<"div">>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    ...stylexProps(className, styles.card, xstyle),
    "data-slot": "card",
  }

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}

export function CardFrame({
  xstyle: consumerXstyle,
  className,
  render,
  ...restProps
}: StyleXComponentProps<useRender.ComponentProps<"div">>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    ...stylexProps(className, styles.frame, xstyle),
    "data-slot": "card-frame",
  }

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}

export function CardFrameHeader({
  xstyle: consumerXstyle,
  className,
  render,
  ...restProps
}: StyleXComponentProps<useRender.ComponentProps<"div">>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    ...stylexProps(className, styles.frameHeader, xstyle),
    "data-slot": "card-frame-header",
  }

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}

export function CardFrameTitle({
  xstyle: consumerXstyle,
  className,
  render,
  ...restProps
}: StyleXComponentProps<useRender.ComponentProps<"div">>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    ...stylexProps(className, styles.frameTitle, xstyle),
    "data-slot": "card-frame-title",
  }

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}

export function CardFrameDescription({
  xstyle: consumerXstyle,
  className,
  render,
  ...restProps
}: StyleXComponentProps<useRender.ComponentProps<"div">>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    ...stylexProps(className, styles.frameDescription, xstyle),
    "data-slot": "card-frame-description",
  }

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}

export function CardFrameAction({
  xstyle: consumerXstyle,
  className,
  render,
  ...restProps
}: StyleXComponentProps<useRender.ComponentProps<"div">>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    ...stylexProps(className, styles.frameAction, xstyle),
    "data-slot": "card-frame-action",
  }

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}

export function CardFrameFooter({
  xstyle: consumerXstyle,
  className,
  render,
  ...restProps
}: StyleXComponentProps<useRender.ComponentProps<"div">>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    ...stylexProps(className, styles.frameFooter, xstyle),
    "data-slot": "card-frame-footer",
  }

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}

export function CardHeader({
  xstyle: consumerXstyle,
  separator = false,
  className,
  render,
  ...restProps
}: StyleXComponentProps<
  useRender.ComponentProps<"div">,
  { separator?: boolean }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    ...stylexProps(
      className,
      styles.header,
      separator && styles.headerSeparator,
      xstyle,
    ),
    "data-slot": "card-header",
    "data-separator": separator ? "" : undefined,
  }

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}

export function CardTitle({
  xstyle: consumerXstyle,
  className,
  render,
  ...restProps
}: StyleXComponentProps<useRender.ComponentProps<"div">>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    ...stylexProps(className, styles.title, xstyle),
    "data-slot": "card-title",
  }

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}

export function CardDescription({
  xstyle: consumerXstyle,
  className,
  render,
  ...restProps
}: StyleXComponentProps<useRender.ComponentProps<"div">>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    ...stylexProps(className, styles.description, xstyle),
    "data-slot": "card-description",
  }

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}

export function CardAction({
  xstyle: consumerXstyle,
  className,
  render,
  ...restProps
}: StyleXComponentProps<useRender.ComponentProps<"div">>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    ...stylexProps(className, styles.action, xstyle),
    "data-slot": "card-action",
  }

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}

export function CardPanel({
  xstyle: consumerXstyle,
  className,
  render,
  ...restProps
}: StyleXComponentProps<useRender.ComponentProps<"div">>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    ...stylexProps(className, styles.panel, xstyle),
    "data-slot": "card-panel",
  }

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}

export function CardFooter({
  xstyle: consumerXstyle,
  separator = false,
  className,
  render,
  ...restProps
}: StyleXComponentProps<
  useRender.ComponentProps<"div">,
  { separator?: boolean }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    ...stylexProps(
      className,
      styles.footer,
      separator && styles.footerSeparator,
      xstyle,
    ),
    "data-slot": "card-footer",
    "data-separator": separator ? "" : undefined,
  }

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}

export { CardPanel as CardContent }
