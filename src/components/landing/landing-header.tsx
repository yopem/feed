"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import Logo from "@/components/logo"
import ThemeSwitcher from "@/components/theme/theme-switcher"

/**
 * Landing page header with scroll-responsive behavior
 *
 * Features:
 * - Logo-based branding linking to yopem.com
 * - "Read" text linking to app home page
 * - Scroll detection that triggers compact mode at 50px threshold
 * - Smooth transitions between default and scrolled states
 * - Cal.com-inspired modern aesthetic with subtle borders and backdrop blur
 */
export default function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`border-border sticky top-0 z-10 w-full transition-all duration-200 ${
        isScrolled
          ? "bg-background/95 border-b backdrop-blur-sm"
          : "bg-background border-b-0"
      }`}
    >
      <div
        className={`mx-auto flex items-center justify-between transition-all duration-200 ${
          isScrolled
            ? "h-14 max-w-5xl px-4 md:px-6"
            : "h-16 max-w-7xl px-4 md:px-8"
        }`}
      >
        <div className="flex items-center gap-2">
          <Link
            href="https://yopem.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center"
          >
            <Logo
              className={`transition-all duration-200 ${
                isScrolled ? "h-6 w-6" : "h-8 w-8"
              }`}
            />
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link
            href="/"
            className={`font-semibold transition-all duration-200 ${
              isScrolled ? "text-sm" : "text-base"
            }`}
          >
            Read
          </Link>
        </div>
        <ThemeSwitcher />
      </div>
    </header>
  )
}
