import * as stylex from "@stylexjs/stylex"

import {
  darkTheme,
  lightTheme,
  rootStyles,
  themeMarker,
  type tokens,
} from "ui/styles/tokens.stylex"

export type Theme = "dark" | "light" | "system"

export type ResolvedTheme = Exclude<Theme, "system">

export const STORAGE_KEY = "yopem-ui-theme"

export const MEDIA_QUERY = "(prefers-color-scheme: dark)"

const schemes = stylex.create({
  light: { colorScheme: "light" },
  dark: { colorScheme: "dark" },
})

// Compile both complete themes here. Pass the resulting serializable config to
// getRootThemeProps, ThemeScript and ThemeProvider, including across Next RSC.
export function createThemeConfig(themes: {
  light: stylex.Theme<typeof tokens>
  dark: stylex.Theme<typeof tokens>
}) {
  const light = stylex.props(
    themeMarker,
    rootStyles.html,
    themes.light,
    schemes.light,
  )

  const dark = stylex.props(
    themeMarker,
    rootStyles.html,
    themes.dark,
    schemes.dark,
  )

  return {
    light,
    dark,
    classes: {
      light: (light.className ?? "").split(" ").filter(Boolean),
      dark: (dark.className ?? "").split(" ").filter(Boolean),
      marker: (stylex.props(themeMarker).className ?? "")
        .split(" ")
        .filter(Boolean),
    },
  }
}

export const themeConfig = createThemeConfig({
  light: lightTheme,
  dark: darkTheme,
})

export type ThemeConfig = typeof themeConfig

export const themeClasses = themeConfig.classes

export const themeClassNames = {
  light: themeConfig.light.className ?? "",
  dark: themeConfig.dark.className ?? "",
  marker: stylex.props(themeMarker).className ?? "",
}

export function getRootThemeProps(
  theme: ResolvedTheme = "light",
  themes = themeConfig,
) {
  return themes[theme]
}
