import { render as rtlRender, screen, waitFor } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { useTheme } from "next-themes"

import ThemeSwitcher from "@/components/theme/theme-switcher"

jest.mock("next-themes", () => ({
  useTheme: jest.fn(),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))

describe("ThemeSwitcher", () => {
  const mockSetTheme = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders loading state before mount", () => {
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
    })

    rtlRender(<ThemeSwitcher />)

    const button = screen.getByRole("button")
    expect(button).toBeInTheDocument()
    expect(screen.getByText("Toggle theme")).toBeInTheDocument()
  })

  it("renders button after mount with light theme", async () => {
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
    })

    rtlRender(<ThemeSwitcher />)

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /toggle theme/i }),
      ).toBeInTheDocument()
    })
  })

  it("renders button after mount with dark theme", async () => {
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: "dark",
      setTheme: mockSetTheme,
    })

    rtlRender(<ThemeSwitcher />)

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /toggle theme/i }),
      ).toBeInTheDocument()
    })
  })

  it("toggles from light to dark theme when clicked", async () => {
    const user = userEvent.setup()
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
    })

    rtlRender(<ThemeSwitcher />)

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /toggle theme/i }),
      ).toBeInTheDocument()
    })

    const button = screen.getByRole("button", { name: /toggle theme/i })
    await user.click(button)

    expect(mockSetTheme).toHaveBeenCalledWith("dark")
  })

  it("toggles from dark to light theme when clicked", async () => {
    const user = userEvent.setup()
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: "dark",
      setTheme: mockSetTheme,
    })

    rtlRender(<ThemeSwitcher />)

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /toggle theme/i }),
      ).toBeInTheDocument()
    })

    const button = screen.getByRole("button", { name: /toggle theme/i })
    await user.click(button)

    expect(mockSetTheme).toHaveBeenCalledWith("light")
  })

  it("has accessible label and title", async () => {
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
    })

    rtlRender(<ThemeSwitcher />)

    await waitFor(() => {
      const button = screen.getByRole("button", { name: /toggle theme/i })
      expect(button).toHaveAttribute("title", "Toggle theme")
      expect(button).toHaveAttribute("aria-label", "Toggle theme")
    })
  })
})
