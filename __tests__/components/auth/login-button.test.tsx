import { render as rtlRender, screen } from "@testing-library/react"

import LoginButton from "@/components/auth/login-button"

jest.mock("@/lib/auth/login", () => ({
  login: jest.fn(),
}))

describe("LoginButton", () => {
  it("renders login button with correct text", () => {
    rtlRender(<LoginButton />)
    expect(
      screen.getByRole("button", { name: /login with google/i }),
    ).toBeInTheDocument()
  })

  it("renders login icon", () => {
    rtlRender(<LoginButton />)
    const button = screen.getByRole("button", { name: /login with google/i })
    const svg = button.querySelector("svg")
    expect(svg).toBeInTheDocument()
  })

  it("renders as a form with login action", () => {
    const { container } = rtlRender(<LoginButton />)
    const form = container.querySelector("form")
    expect(form).toBeInTheDocument()
  })

  it("has accessible button role", () => {
    rtlRender(<LoginButton />)
    const button = screen.getByRole("button")
    expect(button).toBeInTheDocument()
  })

  it("button is not disabled by default", () => {
    rtlRender(<LoginButton />)
    const button = screen.getByRole("button", { name: /login with google/i })
    expect(button).not.toBeDisabled()
  })
})
