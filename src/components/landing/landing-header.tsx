"use client"

import Link from "next/link"

import ThemeSwitcher from "@/components/theme/theme-switcher"
import { Button } from "@/components/ui/button"
import { siteTitle } from "@/lib/env/client"

/**
 * Landing page header with branding, theme switcher, and sign-in link
 */
export default function LandingHeader() {
  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-10 w-full border-b-2 backdrop-blur">
      <div className="relative container flex h-14 items-center justify-center px-4 sm:h-16 md:px-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2" aria-label="Home">
            <span className="text-base font-semibold sm:text-lg">
              {siteTitle}
            </span>
          </Link>
        </div>

        <nav
          className="absolute right-4 flex items-center gap-1 sm:gap-2 md:right-8"
          aria-label="Main navigation"
        >
          <ThemeSwitcher />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="sm:size-default text-sm sm:text-base"
          >
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
