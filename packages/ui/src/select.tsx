"use client"

import type * as React from "react"

import { mergeProps } from "@base-ui/react/merge-props"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { useRender } from "@base-ui/react/use-render"
import * as stylex from "@stylexjs/stylex"
import { clsx } from "clsx"
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
} from "lucide-react"

import type { StyleXComponentProps } from "ui/lib/stylex"
import {
  isCallback,
  isString,
  mergeStylexProps,
  stylexProps,
} from "ui/lib/stylex"
import { themeMarker, tokens } from "ui/styles/tokens.stylex"

export const selectSlotStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
  },
})

const styles = stylex.create({
  trigger: {
    lineHeight: {
      default: null,
      ':is([data-slot="group"] [data-slot="select-trigger"])': {
        default: "1.5rem",
        "@media (min-width: 640px)": "1.25rem",
      },
    },
    alignItems: "center",
    backgroundClip: "padding-box",
    backgroundColor: {
      default: tokens["--background"],
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "color-mix(in oklab, var(--input, transparent) 32%, transparent)",
    },
    borderColor: {
      default: tokens["--input"],
      ":focus-visible": tokens["--ring"],
      "[aria-invalid]":
        "color-mix(in oklab, var(--destructive, currentColor) 36%, transparent)",
    },
    borderRadius: tokens["--radius-lg"],
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: {
      default: "0 1px 2px color-mix(in oklab, #000 5%, transparent)",
      ":focus-visible": `0 0 0 3px color-mix(in oklab, var(--ring, currentColor) 24%, transparent)`,
      "[data-pressed]": "none",
    },
    color: tokens["--foreground"],
    display: "inline-flex",
    fontSize: {
      default: "1rem",
      "@media (min-width: 640px)": "0.875rem",
    },
    gap: "0.5rem",
    inlineSize: "100%",
    justifyContent: "space-between",
    minBlockSize: {
      default: "2.25rem",
      "@media (min-width: 640px)": "2rem",
    },
    minInlineSize: "9rem",
    outline: "none",
    paddingInline: "calc(0.75rem - 1px)",
    position: "relative",
    textAlign: "start",
    transitionProperty: "box-shadow",
    userSelect: "none",
    opacity: {
      default: null,
      "[data-disabled]": 0.64,
    },
    pointerEvents: {
      default: null,
      "[data-disabled]": "none",
    },
    "::before": {
      borderRadius: "calc(var(--radius-lg, 0.625rem) - 1px)",
      boxShadow: "0 1px rgb(0 0 0 / 0.04)",
      content: '""',
      inset: 0,
      pointerEvents: "none",
      position: "absolute",
    },
    "::after": {
      content: {
        default: null,
        "@media (pointer: coarse)": '""',
      },
      minBlockSize: {
        default: null,
        "@media (pointer: coarse)": "2.75rem",
      },
      position: {
        default: null,
        "@media (pointer: coarse)": "absolute",
      },
      inlineSize: {
        default: null,
        "@media (pointer: coarse)": "100%",
      },
    },
  },
  triggerLarge: {
    minBlockSize: { default: "2.5rem", "@media (min-width: 640px)": "2.25rem" },
  },
  triggerSmall: {
    gap: "0.375rem",
    minBlockSize: { default: "2rem", "@media (min-width: 640px)": "1.75rem" },
    paddingInline: "calc(0.625rem - 1px)",
  },
  button: { minInlineSize: 0 },
  buttonValue: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  value: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    "[data-placeholder]": { color: tokens["--muted-foreground"] },
  },
  triggerIcon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    marginInlineEnd: "-0.25rem",
    opacity: 0.8,
  },
  positioner: { userSelect: "none", zIndex: 50 },
  popup: {
    color: tokens["--foreground"],
    outline: "none",
    transformOrigin: "var(--transform-origin)",
  },
  scrollArrow: {
    alignItems: "center",
    blockSize: "1.5rem",
    cursor: "default",
    display: "flex",
    inlineSize: "100%",
    justifyContent: "center",
    position: "relative",
    zIndex: 50,
  },
  scrollUp: { insetBlockStart: 0 },
  scrollDown: { insetBlockEnd: 0 },
  arrowIcon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    position: "relative",
  },
  popupSurface: {
    backgroundClip: "padding-box",
    backgroundColor: tokens["--popover"],
    blockSize: "100%",
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-lg"],
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 10px 15px -3px color-mix(in oklab, #000 5%, transparent)",
    minInlineSize: "var(--anchor-width)",
    position: "relative",
    "::before": {
      borderRadius: "calc(var(--radius-lg, 0.625rem) - 1px)",
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
  },
  list: {
    maxBlockSize: "var(--available-height)",
    overflowY: "auto",
    padding: "0.25rem",
  },
  item: {
    minInlineSize: {
      default: null,
      ':is([data-slot="select-positioner"][data-side="none"] [data-slot="select-item"])':
        "calc(var(--anchor-width) + 1.25rem)",
    },
    alignItems: "center",
    borderRadius: tokens["--radius-sm"],
    cursor: "default",
    display: "grid",
    fontSize: {
      default: "1rem",
      "@media (min-width: 640px)": "0.875rem",
    },
    gap: "0.5rem",
    gridTemplateColumns: "1rem 1fr",
    minBlockSize: {
      default: "2rem",
      "@media (min-width: 640px)": "1.75rem",
    },
    outline: "none",
    paddingBlock: "0.25rem",
    paddingInlineEnd: "1rem",
    paddingInlineStart: "0.5rem",
    backgroundColor: {
      default: null,
      "[data-highlighted]": tokens["--accent"],
    },
    color: {
      default: null,
      "[data-highlighted]": tokens["--accent-foreground"],
    },
    opacity: {
      default: null,
      "[data-disabled]": 0.64,
    },
    pointerEvents: {
      default: null,
      "[data-disabled]": "none",
    },
  },
  itemIndicator: { gridColumnStart: 1 },
  itemText: { gridColumnStart: 2, minInlineSize: 0 },
  separator: {
    backgroundColor: tokens["--border"],
    blockSize: 1,
    marginBlock: "0.25rem",
    marginInline: "0.5rem",
  },
  label: {
    marginBlockEnd: {
      default: null,
      ':not([data-slot="field"] *)': "0.5rem",
    },
    alignItems: "center",
    color: tokens["--foreground"],
    cursor: "default",
    display: "inline-flex",
    fontSize: {
      default: "1rem",
      "@media (min-width: 640px)": "0.875rem",
    },
    fontWeight: 500,
    gap: "0.5rem",
    lineHeight: {
      default: "1.125rem",
      "@media (min-width: 640px)": "1rem",
    },
  },
  groupLabel: {
    color: tokens["--muted-foreground"],
    fontSize: "0.75rem",
    fontWeight: 500,
    paddingBlock: "0.375rem",
    paddingInline: "0.5rem",
  },
})

const sizeStyles = {
  default: null,
  lg: styles.triggerLarge,
  sm: styles.triggerSmall,
} as const

type SelectSize = keyof typeof sizeStyles

export const Select: typeof SelectPrimitive.Root = SelectPrimitive.Root

export function selectTriggerVariants({
  className,
  size = "default",
}: { className?: string; size?: SelectSize | null } = {}) {
  return clsx(
    stylex.props(styles.trigger, sizeStyles[size ?? "default"]).className,
    className,
  )
}

export const selectTriggerIconClassName = stylex.props(
  styles.triggerIcon,
).className

export type SelectButtonProps = StyleXComponentProps<
  useRender.ComponentProps<"button">,
  {
    size?: SelectSize | null
  }
>

export function SelectButton({
  xstyle: consumerXstyle,
  className,
  size,
  render,
  children,
  ...restProps
}: StyleXComponentProps<SelectButtonProps>) {
  const props = restProps
  const xstyle = consumerXstyle

  const typeValue: React.ButtonHTMLAttributes<HTMLButtonElement>["type"] =
    render ? undefined : "button"

  const defaultProps = {
    children: (
      <>
        <span {...stylex.props(styles.buttonValue)}>{children}</span>
        <ChevronsUpDownIcon className={selectTriggerIconClassName} />
      </>
    ),
    ...stylexProps(
      className,
      styles.trigger,
      sizeStyles[size ?? "default"],
      styles.button,
      xstyle,
    ),
    "data-slot": "select-button",
    type: typeValue,
  }

  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  })
}

export function SelectTrigger({
  xstyle: consumerXstyle,
  className,
  size = "default",
  children,
  ...restProps
}: StyleXComponentProps<
  SelectPrimitive.Trigger.Props,
  { size?: SelectSize | null }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      {...mergeStylexProps(
        stylexProps(
          className,
          styles.trigger,
          sizeStyles[size ?? "default"],
          xstyle,
        ),
        props,
      )}
    >
      {children}
      <SelectPrimitive.Icon data-slot="select-icon">
        <ChevronsUpDownIcon className={selectTriggerIconClassName} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

export function SelectValue({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<SelectPrimitive.Value.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      {...mergeStylexProps(stylexProps(className, styles.value, xstyle), props)}
    />
  )
}

export function SelectPopup({
  xstyle: consumerXstyle,
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "start",
  alignOffset = 0,
  alignItemWithTrigger = true,
  anchor,
  portalProps,
  ...restProps
}: StyleXComponentProps<
  SelectPrimitive.Popup.Props,
  {
    portalProps?: SelectPrimitive.Portal.Props
    side?: SelectPrimitive.Positioner.Props["side"]
    sideOffset?: SelectPrimitive.Positioner.Props["sideOffset"]
    align?: SelectPrimitive.Positioner.Props["align"]
    alignOffset?: SelectPrimitive.Positioner.Props["alignOffset"]
    alignItemWithTrigger?: SelectPrimitive.Positioner.Props["alignItemWithTrigger"]
    anchor?: SelectPrimitive.Positioner.Props["anchor"]
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <SelectPrimitive.Portal {...portalProps}>
      <SelectPrimitive.Positioner
        align={align}
        alignItemWithTrigger={alignItemWithTrigger}
        alignOffset={alignOffset}
        anchor={anchor}
        {...stylex.props(styles.positioner)}
        data-slot="select-positioner"
        side={side}
        sideOffset={sideOffset}
      >
        <SelectPrimitive.Popup
          data-slot="select-popup"
          {...mergeStylexProps(
            stylexProps(
              isCallback(className) ? className : undefined,
              styles.popup,
              xstyle,
            ),
            props,
          )}
        >
          <SelectPrimitive.ScrollUpArrow
            {...stylex.props(styles.scrollArrow, styles.scrollUp)}
            data-slot="select-scroll-up-arrow"
          >
            <ChevronUpIcon {...stylex.props(styles.arrowIcon)} />
          </SelectPrimitive.ScrollUpArrow>
          <div {...stylex.props(styles.popupSurface)}>
            <SelectPrimitive.List
              {...stylexProps(
                isString(className) ? className : undefined,
                styles.list,
              )}
              data-slot="select-list"
            >
              {children}
            </SelectPrimitive.List>
          </div>
          <SelectPrimitive.ScrollDownArrow
            {...stylex.props(styles.scrollArrow, styles.scrollDown)}
            data-slot="select-scroll-down-arrow"
          >
            <ChevronDownIcon {...stylex.props(styles.arrowIcon)} />
          </SelectPrimitive.ScrollDownArrow>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

export function SelectItem({
  xstyle: consumerXstyle,
  className,
  children,
  ...restProps
}: StyleXComponentProps<SelectPrimitive.Item.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      {...mergeStylexProps(stylexProps(className, styles.item, xstyle), props)}
    >
      <SelectPrimitive.ItemIndicator {...stylex.props(styles.itemIndicator)}>
        <CheckIcon
          {...stylex.props(selectSlotStyles.icon)}
          aria-hidden="true"
        />
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText {...stylex.props(styles.itemText)}>
        {children}
      </SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

export function SelectSeparator({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<SelectPrimitive.Separator.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      {...mergeStylexProps(
        stylexProps(className, styles.separator, xstyle),
        props,
      )}
    />
  )
}

export function SelectGroup({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<SelectPrimitive.Group.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}

export function SelectLabel({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<SelectPrimitive.Label.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      {...mergeStylexProps(stylexProps(className, styles.label, xstyle), props)}
    />
  )
}

export function SelectGroupLabel({
  className,
  xstyle: consumerXstyle,
  ...restProps
}: StyleXComponentProps<SelectPrimitive.GroupLabel.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-group-label"
      {...mergeStylexProps(
        stylexProps(className, styles.groupLabel, xstyle),
        props,
      )}
    />
  )
}

export { SelectPrimitive, SelectPopup as SelectContent }
