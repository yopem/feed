import { render as rtlRender, screen } from "@testing-library/react"

import LogoutButton from "@/components/auth/logout-button"

jest.mock("@/lib/auth/logout", () => ({
  logout: jest.fn(),
}))

describe("LogoutButton", () => {
  it("renders logout button with correct text", () => {
    rtlRender(<LogoutButton />)
    expect(screen.getByRole("button", { name: /keluar/i })).toBeInTheDocument()
  })

  it("renders logout icon", () => {
    rtlRender(<LogoutButton />)
    const button = screen.getByRole("button", { name: /keluar/i })
    const svg = button.querySelector("svg")
    expect(svg).toBeInTheDocument()
  })

  it("renders as a form with logout action", () => {
    const { container } = rtlRender(<LogoutButton />)
    const form = container.querySelector("form")
    expect(form).toBeInTheDocument()
  })

  it("has accessible aria-label", () => {
    rtlRender(<LogoutButton />)
    const button = screen.getByLabelText("Keluar")
    expect(button).toBeInTheDocument()
  })

  it("has cursor-pointer class for hover effect", () => {
    rtlRender(<LogoutButton />)
    const button = screen.getByRole("button", { name: /keluar/i })
    expect(button).toHaveClass("cursor-pointer")
  })

  it('displays text "Keluar"', () => {
    rtlRender(<LogoutButton />)
    expect(screen.getByText("Keluar")).toBeInTheDocument()
  })
})
