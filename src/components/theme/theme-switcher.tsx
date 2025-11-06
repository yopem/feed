"use client"

import * as React from "react"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme()

  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" className="size-10 cursor-pointer px-0">
        <div className="size-5" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const toggle = () => setTheme(theme === "dark" ? "light" : "dark")

  return (
    <Button
      aria-label="Toggle theme"
      title="Toggle theme"
      variant="ghost"
      className="size-10 cursor-pointer px-0"
      onClick={toggle}
    >
      {theme === "dark" ? (
        <SunIcon className="size-5 transition-all" />
      ) : (
        <MoonIcon className="size-5 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export default ThemeSwitcher
