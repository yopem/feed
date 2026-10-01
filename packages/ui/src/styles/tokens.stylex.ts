import * as stylex from "@stylexjs/stylex"

// Extend themes HERE with complete values: partial createTheme falls back to light defaults.
// StyleX 0.19 cannot expand imported object spreads. Keep ...lightValues / ...darkValues
// in this module, then export the resulting createTheme for use elsewhere.
// Plain local constants avoid defineConsts '--key' names being substituted for
// live CSS variables during StyleX's final CSS processing.
export const lightValues = {
  "--spacing": "0.25rem",
  "--accent": "color-mix(in oklab, #000 4%, transparent)",
  "--accent-foreground": "oklch(26.9% 0 none)",
  "--background": "#fff",
  "--border": "color-mix(in oklab, #000 8%, transparent)",
  "--button-outline-shadow":
    "rgba(0, 0, 0, 0) 0 0 0 0, rgba(0, 0, 0, 0) 0 0 0 0, rgba(0, 0, 0, 0) 0 0 0 0, rgba(0, 0, 0, 0) 0 0 0 0, 0 1px 2px oklab(0 0 0 / 0.05)",
  "--button-outline-inset-shadow":
    "rgba(0, 0, 0, 0) 0 0 0 0, rgba(0, 0, 0, 0) 0 0 0 0, rgba(0, 0, 0, 0) 0 0 0 0, rgba(0, 0, 0, 0) 0 0 0 0, 0 1px 0 oklab(0 0 0 / 0.04)",
  "--button-outline-inset-shadow-dark":
    "rgba(0, 0, 0, 0) 0 0 0 0, rgba(0, 0, 0, 0) 0 0 0 0, rgba(0, 0, 0, 0) 0 0 0 0, rgba(0, 0, 0, 0) 0 0 0 0, 0 -1px 0 oklab(1 0 0 / 0.06)",
  "--button-solid-inset-highlight":
    "inset 0 1px 0 color-mix(in oklab, #fff 16%, transparent)",
  "--button-solid-inset-pressed": "inset 0 1px 0 oklab(0 0 0 / 0.08)",
  "--card": "#fff",
  "--card-foreground": "oklch(26.9% 0 none)",
  "--code": "#fff",
  "--code-foreground": "oklch(26.9% 0 none)",
  "--code-highlight": "color-mix(in oklab, #000 4%, transparent)",
  "--destructive": "oklch(63.7% 0.237 25.331)",
  "--destructive-foreground": "oklch(50.5% 0.213 27.518)",
  "--font-heading": '"Figtree Variable", Figtree, sans-serif',
  "--font-mono":
    '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace',
  "--font-sans": '"Figtree Variable", Figtree, sans-serif',
  "--foreground": "oklch(26.9% 0 none)",
  "--info": "oklch(62.3% 0.214 259.815)",
  "--info-foreground": "oklch(48.8% 0.243 264.376)",
  "--input": "color-mix(in oklab, #000 10%, transparent)",
  "--muted": "color-mix(in oklab, #000 4%, transparent)",
  "--muted-foreground": "color-mix(in srgb, oklch(55.6% 0 none) 90%, #000)",
  "--popover": "#fff",
  "--popover-foreground": "oklch(26.9% 0 none)",
  "--primary": "oklch(26.9% 0 none)",
  "--primary-foreground": "oklch(98.5% 0 none)",
  "--radius": "0.625rem",
  "--radius-lg": "0.625rem",
  "--radius-md": "0.5rem",
  "--radius-sm": "0.375rem",
  "--radius-xl": "0.875rem",
  "--ring": "oklch(70.8% 0 none)",
  "--secondary": "color-mix(in oklab, #000 4%, transparent)",
  "--secondary-foreground": "oklch(26.9% 0 none)",
  "--sidebar": "oklch(98.5% 0 none)",
  "--sidebar-accent": "color-mix(in oklab, #000 4%, transparent)",
  "--sidebar-accent-foreground": "oklch(26.9% 0 none)",
  "--sidebar-border": "color-mix(in oklab, #000 6%, transparent)",
  "--sidebar-foreground":
    "color-mix( in srgb, oklch(26.9% 0 none) 64%, oklch(98.5% 0 none) )",
  "--sidebar-primary": "oklch(26.9% 0 none)",
  "--sidebar-primary-foreground": "oklch(98.5% 0 none)",
  "--sidebar-ring": "oklch(70.8% 0 none)",
  "--success": "oklch(69.6% 0.17 162.48)",
  "--success-foreground": "oklch(50.8% 0.118 165.612)",
  "--warning": "oklch(76.9% 0.188 70.08)",
  "--warning-foreground": "oklch(55.5% 0.163 48.998)",
}

export const darkValues = {
  ...lightValues,
  "--accent": "color-mix(in oklab, #fff 4%, transparent)",
  "--accent-foreground": "oklch(97% 0 none)",
  "--background": "color-mix(in srgb, oklch(14.5% 0 none) 96%, #fff)",
  "--border": "color-mix(in oklab, #fff 6%, transparent)",
  "--card":
    "color-mix( in srgb, color-mix(in srgb, oklch(14.5% 0 none) 96%, #fff) 98%, #fff )",
  "--card-foreground": "oklch(97% 0 none)",
  "--code":
    "color-mix( in srgb, color-mix(in srgb, oklch(14.5% 0 none) 96%, #fff) 98%, #fff )",
  "--code-foreground": "oklch(97% 0 none)",
  "--code-highlight": "color-mix(in oklab, #fff 4%, transparent)",
  "--destructive": "color-mix(in srgb, oklch(63.7% 0.237 25.331) 90%, #fff)",
  "--destructive-foreground": "oklch(70.4% 0.191 22.216)",
  "--foreground": "oklch(97% 0 none)",
  "--info": "oklch(62.3% 0.214 259.815)",
  "--info-foreground": "oklch(70.7% 0.165 254.624)",
  "--input": "color-mix(in oklab, #fff 8%, transparent)",
  "--muted": "color-mix(in oklab, #fff 4%, transparent)",
  "--muted-foreground": "oklch(76% 0 none)",
  "--popover":
    "color-mix( in srgb, color-mix(in srgb, oklch(14.5% 0 none) 96%, #fff) 96%, #fff )",
  "--popover-foreground": "oklch(97% 0 none)",
  "--primary": "oklch(97% 0 none)",
  "--primary-foreground": "oklch(26.9% 0 none)",
  "--ring": "oklch(55.6% 0 none)",
  "--secondary": "color-mix(in oklab, #fff 4%, transparent)",
  "--secondary-foreground": "oklch(97% 0 none)",
  "--sidebar": "color-mix(in srgb, oklch(14.5% 0 none) 97%, #fff)",
  "--sidebar-accent": "color-mix(in oklab, #fff 4%, transparent)",
  "--sidebar-accent-foreground": "oklch(97% 0 none)",
  "--sidebar-border": "color-mix(in oklab, #fff 5%, transparent)",
  "--sidebar-foreground":
    "color-mix( in srgb, oklch(97% 0 none) 64%, color-mix(in srgb, oklch(14.5% 0 none) 97%, #fff) )",
  "--sidebar-primary": "oklch(97% 0 none)",
  "--sidebar-primary-foreground": "oklch(26.9% 0 none)",
  "--sidebar-ring": "oklch(70.8% 0 none)",
  "--success": "oklch(69.6% 0.17 162.48)",
  "--success-foreground": "oklch(76.5% 0.177 163.223)",
  "--warning": "oklch(76.9% 0.188 70.08)",
  "--warning-foreground": "oklch(82.8% 0.189 84.429)",
}

export const tokens = stylex.defineVars({ ...lightValues })

export const themeMarker = stylex.defineMarker()

export const lightTheme = stylex.createTheme(tokens, { ...lightValues })

export const darkTheme = stylex.createTheme(tokens, { ...darkValues })

export const rootStyles = stylex.create({
  body: {
    backgroundColor: tokens["--background"],
    color: tokens["--foreground"],
    fontFamily: tokens["--font-sans"],
    minHeight: "100vh",
  },
  html: {
    backgroundColor: tokens["--background"],
    colorScheme: "light",
    color: tokens["--foreground"],
    fontFamily: tokens["--font-sans"],
  },
})
