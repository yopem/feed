"use client"

import type React from "react"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react"

import {
  MEDIA_QUERY,
  STORAGE_KEY,
  themeConfig,
  type ResolvedTheme,
  type Theme,
  type ThemeConfig,
} from "ui/theme/theme"

function subscribeToSystemTheme(callback: () => void) {
  const media = matchMedia(MEDIA_QUERY)
  media.addEventListener("change", callback)

  return () => media.removeEventListener("change", callback)
}

function getSystemTheme() {
  return matchMedia(MEDIA_QUERY).matches ? "dark" : "light"
}

function getServerTheme() {
  return "light" as const
}

interface ThemeContextValue {
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
  theme: Theme
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function getServerPreference() {
  return null
}

export interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  themes?: ThemeConfig
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = STORAGE_KEY,
  themes = themeConfig,
}: ThemeProviderProps) {
  const [preference, setThemeState] = useState<Theme | null>(null)

  const getStoredTheme = useCallback(() => {
    if (preference !== null) return preference

    try {
      const saved = localStorage.getItem(storageKey)

      if (saved === "light" || saved === "dark" || saved === "system")
        return saved
    } catch {
      // Storage can be blocked. Use the configured default instead.
    }

    return defaultTheme
  }, [defaultTheme, preference, storageKey])

  const subscribeToTheme = useCallback(
    (callback: () => void) => {
      const root = document.documentElement

      function syncRoot() {
        const selected = getStoredTheme()
        const resolved = selected === "system" ? getSystemTheme() : selected
        root.classList.remove(...themes.classes.light, ...themes.classes.dark)
        root.classList.add(...themes.classes[resolved])
        root.dataset.theme = resolved
      }

      function systemChanged() {
        syncRoot()
        callback()
      }

      function storageChanged(event: StorageEvent) {
        if (event.key !== storageKey && event.key !== null) return
        setThemeState(null)
        systemChanged()
      }

      syncRoot()
      const unsubscribe = subscribeToSystemTheme(systemChanged)
      window.addEventListener("storage", storageChanged)

      return () => {
        unsubscribe()
        window.removeEventListener("storage", storageChanged)
        root.classList.remove(...themes.classes.light, ...themes.classes.dark)
      }
    },
    [getStoredTheme, storageKey, themes],
  )

  const storedTheme = useSyncExternalStore(
    subscribeToTheme,
    getStoredTheme,
    getServerPreference,
  )

  const theme = preference ?? storedTheme ?? defaultTheme

  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemTheme,
    getServerTheme,
  )

  const resolvedTheme = theme === "system" ? systemTheme : theme

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      try {
        localStorage.setItem(storageKey, nextTheme)
      } catch {
        // Blocked storage must not prevent changing the current theme.
      }

      setThemeState(nextTheme)
    },
    [storageKey],
  )

  const value = useMemo(
    () => ({ resolvedTheme, setTheme, theme }),
    [resolvedTheme, setTheme, theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)

  if (!value) throw new Error("useTheme must be used within ThemeProvider")

  return value
}
