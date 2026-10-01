"use client"

import type * as React from "react"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import * as stylex from "@stylexjs/stylex"
import { clsx } from "clsx"

import type { StyleXComponentProps } from "ui/lib/stylex"
import type { StyleXProps } from "ui/lib/stylex"
import { stylexProps } from "ui/lib/stylex"
import { Spinner } from "ui/spinner"
import { themeMarker, tokens } from "ui/styles/tokens.stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    borderStyle: "solid",
    borderWidth: 1,
    cursor: {
      default: "pointer",
      ":disabled": "default",
    },
    display: "inline-flex",
    flexShrink: 0,
    fontFamily: tokens["--font-sans"],
    fontSize: {
      default: "1rem",
      "@media (min-width: 640px)": "0.875rem",
    },
    fontWeight: 500,
    gap: "0.5rem",
    justifyContent: "center",
    lineHeight: {
      default: "1.5rem",
      "@media (min-width: 640px)": "1.25rem",
    },
    opacity: {
      default: 1,
      ":disabled": 0.64,
    },
    outline: "none",
    pointerEvents: {
      default: "auto",
      ":disabled": "none",
    },
    position: "relative",
    transitionDuration: "150ms",
    transitionProperty: "box-shadow",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    whiteSpace: "nowrap",
    "[data-loading]": {
      color: "transparent",
      userSelect: "none",
    },
    ":focus-visible": {
      boxShadow: "0 0 0 1px var(--background), 0 0 0 3px var(--ring)",
    },
    "::before": {
      borderRadius: "var(--button-inner-radius, calc(var(--radius-lg) - 1px))",
      content: '""',
      inset: 0,
      pointerEvents: "none",
      position: "absolute",
    },
    "::after": {
      blockSize: {
        default: null,
        "@media (pointer: coarse)": "100%",
      },
      content: {
        default: null,
        "@media (pointer: coarse)": '""',
      },
      inlineSize: {
        default: null,
        "@media (pointer: coarse)": "100%",
      },
      inset: 0,
      minBlockSize: {
        default: null,
        "@media (pointer: coarse)": "2.75rem",
      },
      minInlineSize: {
        default: null,
        "@media (pointer: coarse)": "2.75rem",
      },
      position: {
        default: null,
        "@media (pointer: coarse)": "absolute",
      },
    },
  },
  default: {
    backgroundColor: {
      default: tokens["--primary"],
      ":hover":
        "color-mix(in oklab, var(--primary, currentColor) 90%, transparent)",
      "[data-pressed]":
        "color-mix(in oklab, var(--primary, currentColor) 90%, transparent)",
    },
    borderColor: tokens["--primary"],
    boxShadow: {
      default:
        "var(--button-solid-inset-highlight), 0 1px 2px color-mix(in oklab, var(--primary) 24%, transparent)",
      ":active": "var(--button-solid-inset-pressed)",
      "[data-pressed]": "var(--button-solid-inset-pressed)",
      ":disabled": "none",
      ":focus-visible":
        "var(--button-solid-inset-highlight), 0 0 0 1px var(--background), 0 0 0 3px var(--ring), 0 1px 2px color-mix(in oklab, var(--primary) 24%, transparent)",
      ":focus-visible:active":
        "var(--button-solid-inset-pressed), 0 0 0 1px var(--background), 0 0 0 3px var(--ring)",
      ":focus-visible[data-pressed]":
        "var(--button-solid-inset-pressed), 0 0 0 1px var(--background), 0 0 0 3px var(--ring)",
    },
    color: tokens["--primary-foreground"],
  },
  destructive: {
    backgroundColor: {
      default: "color-mix(in oklab, var(--destructive) 78%, #000)",
      ":hover": "color-mix(in oklab, var(--destructive) 72%, #000)",
      "[data-pressed]": "color-mix(in oklab, var(--destructive) 72%, #000)",
    },
    borderColor: "color-mix(in oklab, var(--destructive) 78%, #000)",
    boxShadow: {
      default:
        "var(--button-solid-inset-highlight), 0 1px 2px color-mix(in oklab, var(--destructive) 24%, transparent)",
      ":active": "var(--button-solid-inset-pressed)",
      "[data-pressed]": "var(--button-solid-inset-pressed)",
      ":disabled": "none",
      ":focus-visible":
        "var(--button-solid-inset-highlight), 0 0 0 1px var(--background), 0 0 0 3px var(--ring), 0 1px 2px color-mix(in oklab, var(--destructive) 24%, transparent)",
      ":focus-visible:active":
        "var(--button-solid-inset-pressed), 0 0 0 1px var(--background), 0 0 0 3px var(--ring)",
      ":focus-visible[data-pressed]":
        "var(--button-solid-inset-pressed), 0 0 0 1px var(--background), 0 0 0 3px var(--ring)",
    },
    color: "#fff",
  },
  destructiveOutline: {
    backgroundClip: {
      default: "padding-box",
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]: "border-box",
    },
    backgroundColor: {
      default: tokens["--popover"],
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "color-mix(in oklab, var(--input, currentColor) 32%, transparent)",
      ":hover":
        "color-mix(in oklab, oklch(63.7% 0.237 25.331) 4%, transparent)",
    },
    borderColor: {
      default: tokens["--input"],
      ":hover": "color-mix(in oklab, var(--destructive) 32%, transparent)",
      "[data-pressed]":
        "color-mix(in oklab, var(--destructive) 32%, transparent)",
    },
    boxShadow: {
      default: "var(--button-outline-shadow)",
      ":active": "none",
      "[data-pressed]": "none",
      ":disabled": "none",
      ":focus-visible":
        "0 0 0 1px var(--background), 0 0 0 3px var(--ring), 0 1px 2px color-mix(in oklab, #000 5%, transparent)",
      ":focus-visible:active":
        "0 0 0 1px var(--background), 0 0 0 3px var(--ring)",
      ":focus-visible[data-pressed]":
        "0 0 0 1px var(--background), 0 0 0 3px var(--ring)",
    },
    color: tokens["--destructive-foreground"],
    "::before": {
      boxShadow: {
        default: "var(--button-outline-inset-shadow)",
        [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
          "var(--button-outline-inset-shadow-dark)",
        ":active": "none",
        "[data-pressed]": "none",
        ":disabled": "none",
      },
    },
  },
  ghost: {
    backgroundColor: {
      default: "transparent",
      ":hover": tokens["--accent"],
      "[data-pressed]": tokens["--accent"],
    },
    borderColor: "transparent",
    color: tokens["--foreground"],
  },
  link: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    color: tokens["--foreground"],
    textDecorationLine: {
      default: "none",
      ":hover": "underline",
      "[data-pressed]": "underline",
    },
    textUnderlineOffset: "4px",
  },
  loadingIndicator: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    marginInline: "-0.125rem",
    opacity: 0.8,
    pointerEvents: "none",
    position: "absolute",
  },
  loadingIndicatorSmall: {
    blockSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    inlineSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
  },
  loadingIndicatorLarge: {
    blockSize: { default: "1.25rem", "@media (min-width: 640px)": "1.125rem" },
    inlineSize: { default: "1.25rem", "@media (min-width: 640px)": "1.125rem" },
  },
  loadingIndicatorDefault: {
    color: tokens["--primary-foreground"],
  },
  loadingIndicatorDestructive: {
    color: "#fff",
  },
  loadingIndicatorForeground: {
    color: tokens["--foreground"],
  },
  loadingIndicatorSecondary: {
    color: tokens["--secondary-foreground"],
  },
  outline: {
    backgroundClip: {
      default: "padding-box",
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]: "border-box",
    },
    backgroundColor: {
      default: tokens["--popover"],
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "color-mix(in oklab, var(--input, currentColor) 32%, transparent)",
      ":hover":
        "color-mix(in oklab, var(--accent, currentColor) 50%, transparent)",
      "[data-pressed]":
        "color-mix(in oklab, var(--accent, currentColor) 50%, transparent)",
    },
    borderColor: tokens["--input"],
    boxShadow: {
      default: "var(--button-outline-shadow)",
      ":active": "none",
      "[data-pressed]": "none",
      ":disabled": "none",
      ":focus-visible":
        "0 0 0 1px var(--background), 0 0 0 3px var(--ring), 0 1px 2px color-mix(in oklab, #000 5%, transparent)",
      ":focus-visible:active":
        "0 0 0 1px var(--background), 0 0 0 3px var(--ring)",
      ":focus-visible[data-pressed]":
        "0 0 0 1px var(--background), 0 0 0 3px var(--ring)",
    },
    color: tokens["--foreground"],
    "::before": {
      boxShadow: {
        default: "var(--button-outline-inset-shadow)",
        [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
          "var(--button-outline-inset-shadow-dark)",
        ":active": "none",
        "[data-pressed]": "none",
        ":disabled": "none",
      },
    },
  },
  secondary: {
    backgroundColor: {
      default: tokens["--secondary"],
      ":hover":
        "color-mix(in oklab, var(--secondary, currentColor) 90%, transparent)",
      "[data-pressed]":
        "color-mix(in oklab, var(--secondary, currentColor) 80%, transparent)",
    },
    borderColor: "transparent",
    color: tokens["--secondary-foreground"],
  },
  sizeDefault: {
    borderRadius: tokens["--radius-lg"],
    blockSize: {
      default: "2.25rem",
      "@media (min-width: 640px)": "2rem",
    },
    paddingInline: "calc(0.75rem - 1px)",
  },
  sizeIcon: {
    borderRadius: tokens["--radius-lg"],
    blockSize: {
      default: "2.25rem",
      "@media (min-width: 640px)": "2rem",
    },
    inlineSize: {
      default: "2.25rem",
      "@media (min-width: 640px)": "2rem",
    },
  },
  sizeIconLarge: {
    borderRadius: tokens["--radius-lg"],
    blockSize: {
      default: "2.5rem",
      "@media (min-width: 640px)": "2.25rem",
    },
    inlineSize: {
      default: "2.5rem",
      "@media (min-width: 640px)": "2.25rem",
    },
  },
  sizeIconSmall: {
    borderRadius: tokens["--radius-lg"],
    blockSize: {
      default: "2rem",
      "@media (min-width: 640px)": "1.75rem",
    },
    inlineSize: {
      default: "2rem",
      "@media (min-width: 640px)": "1.75rem",
    },
  },
  sizeIconXLarge: {
    borderRadius: tokens["--radius-lg"],
    blockSize: {
      default: "2.75rem",
      "@media (min-width: 640px)": "2.5rem",
    },
    inlineSize: {
      default: "2.75rem",
      "@media (min-width: 640px)": "2.5rem",
    },
  },
  sizeIconXSmall: {
    borderRadius: tokens["--radius-md"],
    blockSize: {
      default: "1.75rem",
      "@media (min-width: 640px)": "1.5rem",
    },
    inlineSize: {
      default: "1.75rem",
      "@media (min-width: 640px)": "1.5rem",
    },
    "::before": {
      borderRadius: "var(--button-inner-radius, calc(var(--radius-md) - 1px))",
    },
  },
  sizeLarge: {
    borderRadius: tokens["--radius-lg"],
    blockSize: {
      default: "2.5rem",
      "@media (min-width: 640px)": "2.25rem",
    },
    paddingInline: "calc(0.875rem - 1px)",
  },
  sizeSmall: {
    borderRadius: tokens["--radius-lg"],
    blockSize: {
      default: "2rem",
      "@media (min-width: 640px)": "1.75rem",
    },
    gap: "0.375rem",
    paddingInline: "calc(0.625rem - 1px)",
  },
  sizeXLarge: {
    borderRadius: tokens["--radius-lg"],
    blockSize: {
      default: "2.75rem",
      "@media (min-width: 640px)": "2.5rem",
    },
    fontSize: {
      default: "1.125rem",
      "@media (min-width: 640px)": "1rem",
    },
    lineHeight: {
      default: "1.75rem",
      "@media (min-width: 640px)": "1.5rem",
    },
    paddingInline: "calc(1rem - 1px)",
  },
  sizeXSmall: {
    borderRadius: tokens["--radius-md"],
    blockSize: {
      default: "1.75rem",
      "@media (min-width: 640px)": "1.5rem",
    },
    fontSize: {
      default: "0.875rem",
      "@media (min-width: 640px)": "0.75rem",
    },
    gap: "0.25rem",
    lineHeight: {
      default: "1.25rem",
      "@media (min-width: 640px)": "1rem",
    },
    paddingInline: "calc(0.5rem - 1px)",
    "::before": {
      borderRadius: "var(--button-inner-radius, calc(var(--radius-md) - 1px))",
    },
  },
})

const sizeStyles = {
  default: styles.sizeDefault,
  icon: styles.sizeIcon,
  "icon-lg": styles.sizeIconLarge,
  "icon-sm": styles.sizeIconSmall,
  "icon-xl": styles.sizeIconXLarge,
  "icon-xs": styles.sizeIconXSmall,
  lg: styles.sizeLarge,
  sm: styles.sizeSmall,
  xl: styles.sizeXLarge,
  xs: styles.sizeXSmall,
} as const

const variantStyles = {
  default: styles.default,
  destructive: styles.destructive,
  "destructive-outline": styles.destructiveOutline,
  ghost: styles.ghost,
  link: styles.link,
  outline: styles.outline,
  secondary: styles.secondary,
} as const

const loadingIndicatorStyles = {
  default: styles.loadingIndicatorDefault,
  destructive: styles.loadingIndicatorDestructive,
  "destructive-outline": styles.loadingIndicatorForeground,
  ghost: styles.loadingIndicatorForeground,
  link: styles.loadingIndicatorForeground,
  outline: styles.loadingIndicatorForeground,
  secondary: styles.loadingIndicatorSecondary,
} as const

interface ButtonVariantProps extends StyleXProps {
  className?: string
  size?: keyof typeof sizeStyles
  variant?: keyof typeof variantStyles
}

export function buttonVariants({
  xstyle,
  className,
  size = "default",
  variant = "default",
}: ButtonVariantProps = {}) {
  return clsx(
    stylex.props(styles.root, sizeStyles[size], variantStyles[variant], xstyle)
      .className,
    className,
  )
}

export type ButtonProps = StyleXComponentProps<
  useRender.ComponentProps<"button">,
  {
    variant?: ButtonVariantProps["variant"]
    size?: ButtonVariantProps["size"]
    loading?: boolean
  }
>

export function Button({
  xstyle: consumerXstyle,
  className,
  variant,
  size,
  render,
  children,
  loading = false,
  disabled: disabledProp,
  ...restProps
}: ButtonProps) {
  const props = restProps
  const xstyle = consumerXstyle

  const isDisabled = Boolean(loading || disabledProp)

  const typeValue: React.ButtonHTMLAttributes<HTMLButtonElement>["type"] =
    render ? undefined : "button"

  const defaultProps = {
    children: (
      <>
        {children}
        {loading ? (
          <Spinner
            xstyle={[
              styles.loadingIndicator,
              (size === "xs" || size === "icon-xs") &&
                styles.loadingIndicatorSmall,
              (size === "xl" || size === "icon-xl") &&
                styles.loadingIndicatorLarge,
              loadingIndicatorStyles[variant ?? "default"],
            ]}
            data-slot="button-loading-indicator"
          />
        ) : null}
      </>
    ),
    ...stylexProps(
      className,
      styles.root,
      sizeStyles[size ?? "default"],
      variantStyles[variant ?? "default"],
      xstyle,
    ),
    "aria-disabled": loading || undefined,
    "data-loading": loading ? "" : undefined,
    "data-size": size ?? "default",
    "data-slot": "button",
    disabled: isDisabled,
    type: typeValue,
  }

  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  })
}
