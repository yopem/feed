import type { ReactElement, ReactNode } from "react"
import { render as rtlRender, type RenderOptions } from "@testing-library/react"
import { ThemeProvider } from "next-themes"

/**
 * Custom render function that wraps components with necessary providers
 * Use this instead of React Testing Library's render
 *
 * @example
 * import { render, screen } from '@/test-utils/render'
 *
 * test('renders button', () => {
 *   render(<Button>Click me</Button>)
 *   expect(screen.getByText('Click me')).toBeInTheDocument()
 * })
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    )
  }

  return rtlRender(ui, { wrapper: Wrapper, ...options })
}

export * from "@testing-library/react"
export { renderWithProviders as render }
