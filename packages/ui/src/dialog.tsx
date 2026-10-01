"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import * as stylex from "@stylexjs/stylex"
import { XIcon } from "lucide-react"

import { Button } from "ui/button"
import type { StyleXComponentProps } from "ui/lib/stylex"
import { mergeStylexProps, stylexProps } from "ui/lib/stylex"
import { ScrollArea } from "ui/scroll-area"
import { themeMarker, tokens } from "ui/styles/tokens.stylex"

const styles = stylex.create({
  closeIcon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
  },
  backdrop: {
    backdropFilter: "blur(4px)",
    backgroundColor: "rgb(0 0 0 / 0.32)",
    inset: 0,
    position: "fixed",
    transitionDuration: "200ms",
    transitionProperty: "all",
    zIndex: 50,
    "[data-ending-style]": { opacity: 0 },
    "[data-starting-style]": { opacity: 0 },
  },
  viewport: {
    display: "grid",
    gridTemplateRows: "1fr auto 3fr",
    inset: 0,
    justifyItems: "center",
    padding: "1rem",
    position: "fixed",
    zIndex: 50,
  },
  viewportBottomMobile: {
    "@media (max-width: 639px)": {
      gridTemplateRows: "1fr auto",
      padding: 0,
      paddingBlockStart: "3rem",
    },
  },
  popup: {
    backgroundClip: "padding-box",
    backgroundColor: tokens["--popover"],
    borderColor: tokens["--border"],
    borderRadius: "0.875rem",
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 10px 15px -3px color-mix(in oklab, #000 5%, transparent)",
    color: tokens["--popover-foreground"],
    display: "flex",
    flexDirection: "column",
    gridRowStart: 2,
    inlineSize: "100%",
    maxBlockSize: "100%",
    maxInlineSize: "32rem",
    minBlockSize: 0,
    minInlineSize: 0,
    opacity: "calc(1 - var(--nested-dialogs))",
    outline: "none",
    position: "relative",
    transformOrigin: "center",
    transitionDuration: "200ms",
    transitionProperty: "scale, opacity, translate",
    transitionTimingFunction: "ease-in-out",
    willChange: "transform",
    "::before": {
      borderRadius: "calc(0.875rem - 1px)",
      boxShadow: {
        default: "0 1px rgb(0 0 0 / 0.04)",
        [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
          "0 -1px rgb(255 255 255 / 0.06)",
      },
      content: '""',
      inset: 0,
      pointerEvents: "none",
      position: "absolute",
    },
    "[data-ending-style]": { opacity: 0 },
    "[data-starting-style]": { opacity: 0 },
    "@media (min-width: 640px)": {
      scale: "calc(1 - 0.1 * var(--nested-dialogs))",
      "[data-ending-style]": { scale: 0.98 },
      "[data-starting-style]": { scale: 0.98 },
    },
  },
  popupBottomMobile: {
    "@media (max-width: 639px)": {
      borderBlockEndWidth: 0,
      borderInlineWidth: 0,
      borderRadius: 0,
      maxInlineSize: "none",
      transformOrigin: "bottom",
      "::before": { display: "none" },
      "[data-ending-style]": { translate: "0 1rem" },
      "[data-starting-style]": { translate: "0 1rem" },
    },
  },
  close: {
    insetBlockStart: "0.5rem",
    insetInlineEnd: "0.5rem",
    position: "absolute",
  },
  header: {
    paddingBlockEnd: {
      default: null,
      ':is(:is([data-slot="dialog-popup"], [data-slot="sheet-popup"], [data-slot="drawer-popup"]):has([data-slot$="panel"]) > [data-slot="dialog-header"])':
        "0.75rem",
      "@media (max-width: 639px)": "1rem",
    },
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    padding: "1.5rem",
  },
  footer: {
    display: "flex",
    flexDirection: "column-reverse",
    gap: "0.5rem",
    paddingInline: "1.5rem",
    "@media (min-width: 640px)": {
      borderEndEndRadius: "calc(0.875rem - 1px)",
      borderEndStartRadius: "calc(0.875rem - 1px)",
      flexDirection: "row",
      justifyContent: "flex-end",
    },
  },
  footerDefault: {
    backgroundColor:
      "color-mix(in oklab, var(--muted, transparent) 72%, transparent)",
    borderBlockStartColor: tokens["--border"],
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: 1,
    paddingBlock: "1rem",
  },
  footerBare: {
    paddingBlockStart: {
      default: "1rem",
      ':is(:is([data-slot="dialog-popup"], [data-slot="sheet-popup"], [data-slot="drawer-popup"]):has([data-slot$="panel"]) > [data-slot="dialog-footer"])':
        "0.75rem",
    },
    paddingBlockEnd: "1.5rem",
  },
  title: {
    fontFamily: tokens["--font-heading"],
    fontSize: "1.25rem",
    fontWeight: 600,
    lineHeight: 1,
  },
  description: { color: tokens["--muted-foreground"], fontSize: "0.875rem" },
  panel: {
    paddingBlockStart: {
      default: null,
      ':is(:is([data-slot="dialog-popup"], [data-slot="sheet-popup"], [data-slot="drawer-popup"]):has([data-slot$="header"]) [data-slot="dialog-panel"])':
        "0.25rem",
    },
    paddingBlockEnd: {
      default: null,
      ':is(:is([data-slot="dialog-popup"], [data-slot="sheet-popup"], [data-slot="drawer-popup"]):has([data-slot$="footer"][data-variant="bare"]) [data-slot="dialog-panel"])':
        "0.25rem",
    },
    padding: "1.5rem",
  },
})

export const DialogCreateHandle: typeof DialogPrimitive.createHandle =
  DialogPrimitive.createHandle

export const Dialog: typeof DialogPrimitive.Root = DialogPrimitive.Root

export const DialogPortal: typeof DialogPrimitive.Portal =
  DialogPrimitive.Portal

export function DialogTrigger({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<DialogPrimitive.Trigger.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <DialogPrimitive.Trigger
      data-slot="dialog-trigger"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}

export function DialogClose({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<DialogPrimitive.Close.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <DialogPrimitive.Close
      data-slot="dialog-close"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}

export function DialogBackdrop({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<DialogPrimitive.Backdrop.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-backdrop"
      {...mergeStylexProps(
        stylexProps(className, styles.backdrop, xstyle),
        props,
      )}
    />
  )
}

export function DialogViewport({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<DialogPrimitive.Viewport.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <DialogPrimitive.Viewport
      data-slot="dialog-viewport"
      {...mergeStylexProps(
        stylexProps(className, styles.viewport, xstyle),
        props,
      )}
    />
  )
}

export function DialogPopup({
  xstyle: consumerXstyle,
  className,
  children,
  showCloseButton = true,
  bottomStickOnMobile = true,
  closeProps,
  portalProps,
  ...restProps
}: StyleXComponentProps<
  DialogPrimitive.Popup.Props,
  {
    showCloseButton?: boolean
    bottomStickOnMobile?: boolean
    closeProps?: DialogPrimitive.Close.Props
    portalProps?: DialogPrimitive.Portal.Props
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <DialogPortal {...portalProps}>
      <DialogBackdrop />
      <DialogViewport
        className={
          stylex.props(bottomStickOnMobile && styles.viewportBottomMobile)
            .className
        }
      >
        <DialogPrimitive.Popup
          data-slot="dialog-popup"
          {...mergeStylexProps(
            stylexProps(
              className,
              styles.popup,
              bottomStickOnMobile && styles.popupBottomMobile,
              xstyle,
            ),
            props,
          )}
        >
          {children}
          {showCloseButton ? (
            <DialogPrimitive.Close
              aria-label="Close"
              render={
                <Button size="icon" variant="ghost" xstyle={styles.close} />
              }
              {...closeProps}
            >
              <XIcon {...stylex.props(styles.closeIcon)} />
            </DialogPrimitive.Close>
          ) : null}
        </DialogPrimitive.Popup>
      </DialogViewport>
    </DialogPortal>
  )
}

export function DialogHeader({
  xstyle: consumerXstyle,
  className,
  render,
  ...restProps
}: StyleXComponentProps<useRender.ComponentProps<"div">>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    ...stylexProps(className, styles.header, xstyle),
    "data-slot": "dialog-header",
  }

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}

export function DialogFooter({
  xstyle: consumerXstyle,
  className,
  variant = "default",
  render,
  ...restProps
}: StyleXComponentProps<
  useRender.ComponentProps<"div">,
  {
    variant?: "default" | "bare"
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    ...stylexProps(
      className,
      styles.footer,
      variant === "default" ? styles.footerDefault : styles.footerBare,
      xstyle,
    ),
    "data-slot": "dialog-footer",
    "data-variant": variant,
  }

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}

export function DialogTitle({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<DialogPrimitive.Title.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      {...mergeStylexProps(stylexProps(className, styles.title, xstyle), props)}
    />
  )
}

export function DialogDescription({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<DialogPrimitive.Description.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      {...mergeStylexProps(
        stylexProps(className, styles.description, xstyle),
        props,
      )}
    />
  )
}

export function DialogPanel({
  xstyle: consumerXstyle,
  className,
  scrollFade = true,
  render,
  ...restProps
}: StyleXComponentProps<
  useRender.ComponentProps<"div">,
  { scrollFade?: boolean }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    ...stylexProps(className, styles.panel, xstyle),
    "data-slot": "dialog-panel",
  }

  const content = useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })

  return (
    <ScrollArea overscrollContain scrollFade={scrollFade}>
      {content}
    </ScrollArea>
  )
}

export {
  DialogPrimitive,
  DialogBackdrop as DialogOverlay,
  DialogPopup as DialogContent,
}
