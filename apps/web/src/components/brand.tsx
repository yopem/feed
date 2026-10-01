import * as stylex from "@stylexjs/stylex"
import { RssIcon, SunMoonIcon } from "lucide-react"

import { Button } from "ui/button"
import { tokens } from "ui/styles/tokens.stylex"
import { useTheme } from "ui/theme/theme-provider"

const styles = stylex.create({
  iconButton: {
    width: 34,
    paddingInline: 0,
  },
  brand: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 23,
    fontWeight: 750,
    letterSpacing: "-1px",
  },
  symbol: {
    display: "grid",
    placeItems: "center",
    width: 27,
    height: 27,
    borderRadius: 7,
    backgroundColor: tokens["--foreground"],
    color: tokens["--background"],
  },
  icon: {
    width: 17,
    height: 17,
  },
})

export function ThemeButton() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      xstyle={styles.iconButton}
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
    <span {...stylex.props(styles.brand)}>
      <span {...stylex.props(styles.symbol)}>
        <RssIcon {...stylex.props(styles.icon)} aria-hidden="true" />
      </span>
      feed<span>.</span>
    </span>
  )
}
