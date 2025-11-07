import { userEvent } from "@testing-library/user-event"

import { ScrollToTopButton } from "@/components/dashboard/shared/scroll-to-top-button"
import { render, screen, waitFor } from "@/test-utils"

describe("ScrollToTopButton", () => {
  beforeEach(() => {
    window.scrollTo = jest.fn()
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 0,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("does not render when scroll position is below threshold", () => {
    Object.defineProperty(window, "scrollY", { value: 300, configurable: true })
    render(<ScrollToTopButton />)

    const button = screen.queryByRole("button", { name: /scroll to top/i })
    expect(button).not.toBeInTheDocument()
  })

  it("renders when scroll position is above threshold", async () => {
    Object.defineProperty(window, "scrollY", { value: 500, configurable: true })

    render(<ScrollToTopButton />)

    window.dispatchEvent(new Event("scroll"))

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: /scroll to top/i }),
        ).toBeInTheDocument()
      },
      { timeout: 200 },
    )
  })

  it("scrolls to top when clicked", async () => {
    const user = userEvent.setup()
    Object.defineProperty(window, "scrollY", { value: 500, configurable: true })

    render(<ScrollToTopButton />)

    window.dispatchEvent(new Event("scroll"))

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: /scroll to top/i }),
        ).toBeInTheDocument()
      },
      { timeout: 200 },
    )

    const button = screen.getByRole("button", { name: /scroll to top/i })
    await user.click(button)

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    })
  })

  it("scrolls to top when Enter key is pressed", async () => {
    const user = userEvent.setup()
    Object.defineProperty(window, "scrollY", { value: 500, configurable: true })

    render(<ScrollToTopButton />)

    window.dispatchEvent(new Event("scroll"))

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: /scroll to top/i }),
        ).toBeInTheDocument()
      },
      { timeout: 200 },
    )

    const button = screen.getByRole("button", { name: /scroll to top/i })
    button.focus()
    await user.keyboard("{Enter}")

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    })
  })

  it("scrolls to top when Space key is pressed", async () => {
    const user = userEvent.setup()
    Object.defineProperty(window, "scrollY", { value: 500, configurable: true })

    render(<ScrollToTopButton />)

    window.dispatchEvent(new Event("scroll"))

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: /scroll to top/i }),
        ).toBeInTheDocument()
      },
      { timeout: 200 },
    )

    const button = screen.getByRole("button", { name: /scroll to top/i })
    button.focus()
    await user.keyboard(" ")

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    })
  })

  it("has correct accessibility attributes", async () => {
    Object.defineProperty(window, "scrollY", { value: 500, configurable: true })

    render(<ScrollToTopButton />)

    window.dispatchEvent(new Event("scroll"))

    await waitFor(
      () => {
        const button = screen.getByRole("button", { name: /scroll to top/i })
        expect(button).toHaveAttribute("aria-label", "Scroll to top")
        expect(button).toHaveAttribute("title", "Scroll to top")
      },
      { timeout: 200 },
    )
  })
})
