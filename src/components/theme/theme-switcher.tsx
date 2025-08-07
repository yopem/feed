"use client"

import * as React from "react"
import { Icon } from "@yopem-ui/react-icons"
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

  return (
    <Button
      variant="ghost"
      className="size-10 cursor-pointer px-0"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <Icon name="Sun" className="transition-all" />
      ) : (
        <Icon name="Moon" className="transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export default ThemeSwitcher
