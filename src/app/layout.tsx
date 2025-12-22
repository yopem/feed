import "@/styles/globals.css"

import { type Metadata } from "next"
import localFont from "next/font/local"

import Providers from "@/components/providers"
import Scripts from "@/components/scripts"
import { siteDescription, siteTitle } from "@/lib/env/client"

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  icons: [
    {
      rel: "icon",
      type: "image/svg+xml",
      url: "/favicon.svg",
    },
  ],
}

export function generateViewport() {
  return {
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: "#ffffff" },
      { media: "(prefers-color-scheme: dark)", color: "#000000" },
    ],
    colorScheme: "light dark",
  }
}

const adwaitaSans = localFont({
  src: [
    {
      path: "/fonts/AdwaitaSans-Regular.woff2",
      style: "normal",
    },
    {
      path: "/fonts/AdwaitaSans-Italic.woff2",
      style: "italic",
    },
  ],
  variable: "--font-adwaita-sans",
})

const adwaitaMono = localFont({
  src: [
    {
      path: "/fonts/AdwaitaMono-Regular.woff2",
      style: "normal",
    },
    {
      path: "/fonts/AdwaitaMono-Italic.woff2",
      style: "italic",
    },
  ],
  variable: "--font-adwaita-mono",
})

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${adwaitaSans.variable} ${adwaitaMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Providers>{children}</Providers>
        <Scripts />
      </body>
    </html>
  )
}
