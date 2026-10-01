"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import * as stylex from "@stylexjs/stylex"
import * as React from "react"

import type { StyleXComponentProps } from "ui/lib/stylex"
import { mergeStylexProps, stylexProps } from "ui/lib/stylex"
import { themeMarker, tokens } from "ui/styles/tokens.stylex"

type TabsVariant = "default" | "underline"

type TabsSize = "default" | "lg" | "sm"

const TabsListContext = React.createContext<TabsSize>("default")

export const tabsSlotStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
  },
  itemIcon: { marginInline: "-0.125rem" },
})

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    "[data-orientation=vertical]": { flexDirection: "row" },
  },
  list: {
    alignItems: "center",
    color: tokens["--muted-foreground"],
    display: "flex",
    inlineSize: "fit-content",
    justifyContent: "center",
    position: "relative",
    zIndex: 0,
    "[data-orientation=vertical]": { flexDirection: "column" },
  },
  listDefault: {
    backgroundColor: tokens["--muted"],
    borderRadius: tokens["--radius-lg"],
    columnGap: "0.125rem",
    color: tokens["--muted-foreground"],
    padding: "0.125rem",
  },
  listUnderline: {
    columnGap: "0.125rem",
    "[data-orientation=horizontal]": { paddingBlock: "0.25rem" },
    "[data-orientation=vertical]": { paddingInline: "0.25rem" },
  },
  indicator: {
    blockSize: "var(--active-tab-height)",
    bottom: 0,
    inlineSize: "var(--active-tab-width)",
    left: 0,
    position: "absolute",
    transform:
      "translateX(var(--active-tab-left)) translateY(calc(var(--active-tab-bottom) * -1))",
    transitionDuration: "200ms",
    transitionProperty: "width, translate",
    transitionTimingFunction: "ease-in-out",
  },
  indicatorDefault: {
    backgroundColor: {
      default: tokens["--background"],
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        tokens["--input"],
    },
    borderRadius: tokens["--radius-md"],
    boxShadow: "0 1px 2px color-mix(in oklab, #000 5%, transparent)",
    zIndex: -1,
  },
  indicatorUnderline: {
    backgroundColor: tokens["--primary"],
    zIndex: 10,
    "[data-orientation=horizontal]": {
      blockSize: "0.125rem",
      transform:
        "translateX(var(--active-tab-left)) translateY(calc(var(--active-tab-bottom) * -1 + 1px))",
    },
    "[data-orientation=vertical]": {
      inlineSize: "0.125rem",
      transform:
        "translateX(calc(var(--active-tab-left) - 1px)) translateY(calc(var(--active-tab-bottom) * -1))",
    },
  },
  tab: {
    backgroundColor: {
      default: null,
      ':is([data-slot="tabs-list"] > [data-slot="tabs-tab"]:hover)':
        tokens["--accent"],
    },
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: tokens["--radius-md"],
    borderStyle: "solid",
    borderWidth: 1,
    cursor: "pointer",
    display: "flex",
    flexGrow: 1,
    flexShrink: 0,
    fontSize: {
      default: "1rem",
      "@media (min-width: 640px)": "0.875rem",
    },
    fontWeight: 500,
    gap: "0.375rem",
    justifyContent: {
      default: "center",
      "[data-orientation=vertical]": "flex-start",
    },
    outline: "none",
    position: "relative",
    transitionProperty: "color, background-color, box-shadow",
    whiteSpace: "nowrap",
    color: {
      default: null,
      ":hover": tokens["--muted-foreground"],
      "[data-active]": tokens["--foreground"],
    },
    boxShadow: {
      default: null,
      ":focus-visible": `0 0 0 2px ${tokens["--ring"]}`,
    },
    opacity: {
      default: null,
      "[data-disabled]": 0.64,
    },
    pointerEvents: {
      default: null,
      "[data-disabled]": "none",
    },
    inlineSize: {
      default: null,
      "[data-orientation=vertical]": "100%",
    },
  },
  tabDefault: {
    blockSize: { default: "2.125rem", "@media (min-width: 640px)": "1.875rem" },
    paddingInline: "calc(0.625rem - 1px)",
  },
  tabLarge: {
    blockSize: { default: "2.375rem", "@media (min-width: 640px)": "2.125rem" },
    paddingInline: "calc(0.75rem - 1px)",
  },
  tabSmall: {
    blockSize: { default: "1.875rem", "@media (min-width: 640px)": "1.625rem" },
    paddingInline: "calc(0.5rem - 1px)",
  },
  panel: { flex: 1, outline: "none" },
})

const sizeStyles = {
  default: styles.tabDefault,
  lg: styles.tabLarge,
  sm: styles.tabSmall,
} as const

export function Tabs({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<TabsPrimitive.Root.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      {...mergeStylexProps(stylexProps(className, styles.root, xstyle), props)}
    />
  )
}

export function TabsList({
  xstyle: consumerXstyle,
  variant = "default",
  size = "default",
  className,
  children,
  ...restProps
}: StyleXComponentProps<
  TabsPrimitive.List.Props,
  {
    size?: TabsSize
    variant?: TabsVariant
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <TabsPrimitive.List
      data-size={size}
      data-slot="tabs-list"
      {...mergeStylexProps(
        stylexProps(
          className,
          styles.list,
          variant === "default" ? styles.listDefault : styles.listUnderline,
          xstyle,
        ),
        props,
      )}
    >
      <TabsListContext.Provider value={size}>
        {children}
      </TabsListContext.Provider>
      <TabsPrimitive.Indicator
        {...stylex.props(
          styles.indicator,
          variant === "underline"
            ? styles.indicatorUnderline
            : styles.indicatorDefault,
        )}
        data-slot="tab-indicator"
      />
    </TabsPrimitive.List>
  )
}

export function TabsTab({
  xstyle: consumerXstyle,
  className,
  size,
  ...restProps
}: StyleXComponentProps<TabsPrimitive.Tab.Props, { size?: TabsSize }>) {
  const props = restProps
  const xstyle = consumerXstyle

  const contextSize = React.useContext(TabsListContext)
  const resolvedSize = size ?? contextSize

  return (
    <TabsPrimitive.Tab
      data-size={resolvedSize}
      data-slot="tabs-tab"
      {...mergeStylexProps(
        stylexProps(className, styles.tab, sizeStyles[resolvedSize], xstyle),
        props,
      )}
    />
  )
}

export function TabsPanel({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<TabsPrimitive.Panel.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      {...mergeStylexProps(stylexProps(className, styles.panel, xstyle), props)}
    />
  )
}

export {
  TabsPrimitive,
  TabsTab as TabsTrigger,
  TabsPanel as TabsContent,
  type TabsSize,
  type TabsVariant,
}
