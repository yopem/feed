import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"

import { getRootThemeProps } from "ui/theme/theme"
import { ThemeProvider, useTheme } from "ui/theme/theme-provider"
import { ThemeScript } from "ui/theme/theme-script"

function Preference() {
  const { theme, resolvedTheme } = useTheme()

  return (
    <span>
      {theme}:{resolvedTheme}
    </span>
  )
}

test("theme provider has stable server defaults without browser globals", () => {
  expect(
    renderToStaticMarkup(
      <ThemeProvider>
        <Preference />
      </ThemeProvider>,
    ),
  ).toBe("<span>system:light</span>")
  expect(
    renderToStaticMarkup(
      <ThemeProvider defaultTheme="dark">
        <Preference />
      </ThemeProvider>,
    ),
  ).toBe("<span>dark:dark</span>")
  expect(getRootThemeProps("dark").className).not.toBe(
    getRootThemeProps("light").className,
  )
})

test("theme script escapes script terminators and carries CSP nonce", () => {
  const html = renderToStaticMarkup(
    <ThemeScript storageKey="</script><script>unsafe" nonce="test-nonce" />,
  )

  expect(html).toContain('nonce="test-nonce"')
  expect(html).toContain("\\u003c/script>")
  expect(html).not.toContain("</script><script>unsafe")
  expect(html).toContain("r.dataset.theme=v")
})
