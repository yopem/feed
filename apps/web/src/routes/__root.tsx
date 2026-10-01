import type { QueryClient } from "@tanstack/react-query"
import type { ReactNode } from "react"

import * as stylex from "@stylexjs/stylex"
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from "@tanstack/react-router"
import "web/styles.css"

import { Button } from "ui/button"
import { rootStyles, tokens } from "ui/styles/tokens.stylex"
import { getRootThemeProps } from "ui/theme/theme"
import { ThemeProvider } from "ui/theme/theme-provider"
import { ThemeScript } from "ui/theme/theme-script"

const styles = stylex.create({
  body: {
    backgroundColor: tokens["--sidebar"],
  },
  welcome: {
    minHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    padding: 24,
    textAlign: "center",
  },
})

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: "Feed · Your reading space" },
        {
          name: "description",
          content: "An open-source home for your RSS feeds.",
        },
      ],
    }),
    shellComponent: RootDocument,
    component: Outlet,
    notFoundComponent: NotFound,
    errorComponent: PageError,
  },
)

export function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html
      {...getRootThemeProps("light")}
      data-theme="light"
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <ThemeScript storageKey="theme" />
        <HeadContent />
      </head>
      <body {...stylex.props(rootStyles.body, styles.body)}>
        <ThemeProvider storageKey="theme">{children}</ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}

export function NotFound() {
  return (
    <main {...stylex.props(styles.welcome)}>
      <h1>Page not found</h1>
      <Link to="/">Back to your feeds</Link>
    </main>
  )
}

export function PageError() {
  return (
    <main {...stylex.props(styles.welcome)}>
      <h1>Something went wrong</h1>
      <p>Reload to try again.</p>
      <Button onClick={() => window.location.reload()}>Reload Feed</Button>
    </main>
  )
}
