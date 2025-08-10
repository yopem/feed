import "@/styles/globals.css"

import { type Metadata } from "next"
import localFont from "next/font/local"

import Providers from "@/components/providers"
import Scripts from "@/components/scripts"
import { siteDescription, siteTitle } from "@/lib/env/client"

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  icons: [{ rel: "icon", url: "/favicon.png" }],
}

const adwaita = localFont({
  src: [
    {
      path: "/fonts/adwaita-sans-regular.woff2",
      style: "normal",
    },
    {
      path: "/fonts/adwaita-sans-italic.woff2",
      style: "italic",
    },
  ],
  variable: "--font-adwaita-sans",
})

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${adwaita.variable}`} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        <Scripts />
      </body>
    </html>
  )
}
