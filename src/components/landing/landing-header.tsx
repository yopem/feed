"use client"

import Link from "next/link"

import ThemeSwitcher from "@/components/theme/theme-switcher"
import { siteTitle } from "@/lib/env/client"

/**
 * Landing page header with branding, theme switcher, and sign-in link
 */
export default function LandingHeader() {
  return (
    <header className="bg-background border-border sticky top-0 z-10 w-full border-b-2">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 md:px-8">
        <Link href="/" aria-label="Home">
          <span className="text-base font-semibold sm:text-lg">
            {siteTitle}
          </span>
        </Link>
        <ThemeSwitcher />
      </div>
    </header>
  )
}
