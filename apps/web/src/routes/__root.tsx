import type { QueryClient } from "@tanstack/react-query"
import type { ReactNode } from "react"

import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from "@tanstack/react-router"
import { ThemeProvider } from "next-themes"
import styles from "web/styles.css?url"

import { Button } from "ui/button"

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
      links: [{ rel: "stylesheet", href: styles }],
    }),
    shellComponent: RootDocument,
    component: Outlet,
    notFoundComponent: NotFound,
    errorComponent: PageError,
  },
)

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}

function NotFound() {
  return (
    <main className="welcome">
      <h1>Page not found</h1>
      <Link to="/">Back to your feeds</Link>
    </main>
  )
}

function PageError() {
  return (
    <main className="welcome">
      <h1>Something went wrong</h1>
      <p>Reload to try again.</p>
      <Button onClick={() => window.location.reload()}>Reload Feed</Button>
    </main>
  )
}
