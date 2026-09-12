import { RssIcon, SunMoonIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "ui/button"

export function ThemeButton() {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      className="icon-button"
      aria-label="Toggle light or dark theme"
      title="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <SunMoonIcon aria-hidden="true" />
    </Button>
  )
}

export function Brand() {
  return (
    <span className="brand">
      <span className="brand-symbol">
        <RssIcon aria-hidden="true" />
      </span>
      feed<span>.</span>
    </span>
  )
}
