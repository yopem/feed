"use client"

import type * as React from "react"

import { Input as InputPrimitive } from "@base-ui/react/input"
import * as stylex from "@stylexjs/stylex"
import { clsx } from "clsx"

import type { StyleXComponentProps } from "ui/lib/stylex"
import type { StyleXProps } from "ui/lib/stylex"
import { isCallback, isNumber, isString, stylexProps } from "ui/lib/stylex"
import { themeMarker, tokens } from "ui/styles/tokens.stylex"

const styles = stylex.create({
  control: {
    backgroundClip: "padding-box",
    backgroundColor: {
      default: "var(--input-control-background, var(--background))",
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "var(--input-control-background, color-mix(in oklab, var(--input, currentColor) 32%, transparent))",
    },
    borderColor: {
      default: "var(--input-control-border, var(--input))",
      ":has(:focus-visible)": tokens["--ring"],
      ':has([aria-invalid="true"])':
        "color-mix(in oklab, var(--destructive, currentColor) 36%, transparent)",
      ':has([aria-invalid="true"]):has(:focus-visible)':
        "color-mix(in oklab, var(--destructive, currentColor) 36%, transparent)",
    },
    borderRadius: "var(--radius-lg)",
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: {
      default: "var(--input-control-shadow, var(--button-outline-shadow))",
      ':has([aria-invalid="true"])': "none",
      ":has(:focus-visible)":
        "0 0 0 3px color-mix(in oklab, var(--ring, currentColor) 24%, transparent)",
      ':has([aria-invalid="true"]):has(:focus-visible)':
        "0 0 0 3px color-mix(in oklab, var(--ring, currentColor) 24%, transparent)",
      ":has(:disabled)": "none",
    },
    display: {
      default: "inline-flex",
      ':is([data-slot="input-group"] > [data-slot="input-control"])':
        "contents",
    },
    fontSize: {
      default: "1rem",
      "@media (min-width: 640px)": "0.875rem",
    },
    inlineSize: "100%",
    lineHeight: {
      default: "1.5rem",
      "@media (min-width: 640px)": "1.25rem",
    },
    opacity: {
      default: 1,
      ":has(:disabled)": 0.64,
    },
    position: "relative",
    transitionProperty: "box-shadow",
    "::before": {
      borderRadius: "calc(var(--radius-lg) - 1px)",
      boxShadow: {
        default:
          "var(--input-control-inset-shadow, var(--button-outline-inset-shadow))",
        [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
          "var(--input-control-inset-shadow, var(--button-outline-inset-shadow-dark))",
        ":has(:disabled)": "none",
        ":has(:focus-visible)": "none",
        ':has([aria-invalid="true"])': "none",
      },
      content: '""',
      display: "var(--input-control-before-display, block)",
      inset: 0,
      pointerEvents: "none",
      position: "absolute",
    },
  },
  input: {
    blockSize: {
      default: "2.125rem",
      "@media (min-width: 640px)": "1.875rem",
    },
    borderRadius: "inherit",
    color: tokens["--foreground"],
    inlineSize: "100%",
    lineHeight: {
      default: "2.125rem",
      "@media (min-width: 640px)": "1.875rem",
    },
    minInlineSize: 0,
    outline: "none",
    paddingInline: "calc(0.75rem - 1px)",
    transition: "background-color 5000000s ease-in-out 0s",
    "::placeholder": {
      color:
        "color-mix(in oklab, var(--muted-foreground, currentColor) 72%, transparent)",
    },
    WebkitTextFillColor: {
      default: null,
      ":-webkit-autofill": tokens["--foreground"],
    },
    paddingInlineEnd: {
      default: "calc(0.75rem - 1px)",
      ':is([data-slot="group"] [data-slot="input-group"]:has(> [data-align="inline-end"]) [data-slot="input"])':
        "0.5rem",
    },
  },
  small: {
    blockSize: {
      default: "1.875rem",
      "@media (min-width: 640px)": "1.625rem",
    },
    lineHeight: {
      default: "1.875rem",
      "@media (min-width: 640px)": "1.625rem",
    },
    paddingInlineStart: "calc(0.625rem - 1px)",
    paddingInlineEnd: {
      default: "calc(0.625rem - 1px)",
      ':is([data-slot="group"] [data-slot="input-group"]:has(> [data-align="inline-end"]) [data-slot="input"])':
        "0.5rem",
    },
  },
  large: {
    blockSize: {
      default: "2.375rem",
      "@media (min-width: 640px)": "2.125rem",
    },
    lineHeight: {
      default: "2.375rem",
      "@media (min-width: 640px)": "2.125rem",
    },
  },
  search: {
    "::-webkit-search-cancel-button": {
      appearance: "none",
    },
    "::-webkit-search-decoration": {
      appearance: "none",
    },
    "::-webkit-search-results-button": {
      appearance: "none",
    },
    "::-webkit-search-results-decoration": {
      appearance: "none",
    },
  },
  file: {
    color: tokens["--muted-foreground"],
    "::file-selector-button": {
      borderStyle: "solid",
      borderWidth: 0,
      color: tokens["--foreground"],
      fontFamily: "inherit",
      fontSize: "0.875rem",
      fontWeight: 500,
      letterSpacing: "inherit",
      lineHeight: "inherit",
      marginInlineEnd: "0.75rem",
      padding: 0,
      background: "transparent",
    },
  },
  groupControl: {
    display: {
      default: null,
      ':is([data-slot="input-group"] > [data-slot="input-control"])':
        "contents",
    },
  },
})

export type InputProps = StyleXComponentProps<
  Omit<InputPrimitive.Props & React.RefAttributes<HTMLInputElement>, "size">,
  {
    size?: "sm" | "default" | "lg" | number
    unstyled?: boolean
    nativeInput?: boolean
    /** StyleX styles for the decorative wrapper, including Group item geometry. */
    controlXstyle?: StyleXProps["xstyle"]
  }
>

function getInputSizeStyle(size: InputProps["size"]) {
  if (size === "sm") return styles.small

  if (size === "lg") return styles.large

  return null
}

function mergeInputClassName(
  inputClassName: string,
  className: InputProps["className"],
) {
  if (!isCallback(className)) return inputClassName

  return (state: InputPrimitive.State) => clsx(inputClassName, className(state))
}

export function Input({
  xstyle: consumerXstyle,
  controlXstyle,
  className,
  size = "default",
  unstyled = false,
  nativeInput = false,
  ...restProps
}: InputProps) {
  const props = restProps
  const xstyle = consumerXstyle

  const sizeStyle = getInputSizeStyle(size)

  const inputProps = stylexProps(
    undefined,
    styles.input,
    sizeStyle,
    props.type === "search" && styles.search,
    props.type === "file" && styles.file,
    stylex.defaultMarker(),
    xstyle,
  )

  const wrapperClassName = isString(className) ? className : undefined

  return (
    <span
      {...stylexProps(
        wrapperClassName,
        !unstyled && styles.control,
        unstyled && styles.groupControl,
        controlXstyle,
      )}
      data-size={size}
      data-slot="input-control"
    >
      {nativeInput ? (
        <input
          {...inputProps}
          data-slot="input"
          size={isNumber(size) ? size : undefined}
          style={inputProps.style}
          {...props}
        />
      ) : (
        <InputPrimitive
          {...inputProps}
          className={mergeInputClassName(inputProps.className, className)}
          data-slot="input"
          size={isNumber(size) ? size : undefined}
          style={inputProps.style}
          {...props}
        />
      )}
    </span>
  )
}

export { InputPrimitive }
