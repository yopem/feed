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

export interface ThemeScriptProps {
  nonce?: string
  defaultTheme?: Theme
  storageKey?: string
  themes?: ThemeConfig
}

export function ThemeScript({
  nonce,
  defaultTheme = "system",
  storageKey = STORAGE_KEY,
  themes = themeConfig,
}: ThemeScriptProps) {
  // Escape '<' in user-supplied keys/class names so inline JSON cannot close script.
  const config = JSON.stringify({
    storageKey,
    defaultTheme,
    classes: themes.classes,
    media: MEDIA_QUERY,
  }).replace(/</g, "\\u003c")

  const script = `(()=>{const c=${config},r=document.documentElement;let t=c.defaultTheme;try{const s=localStorage.getItem(c.storageKey);if(s==="light"||s==="dark"||s==="system")t=s}catch{}const v=t==="system"?(matchMedia(c.media).matches?"dark":"light"):t;r.classList.remove(...c.classes.light,...c.classes.dark);r.classList.add(...c.classes[v]);r.dataset.theme=v})()`

  return <script dangerouslySetInnerHTML={{ __html: script }} nonce={nonce} />
}
