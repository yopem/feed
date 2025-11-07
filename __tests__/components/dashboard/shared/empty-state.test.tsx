import { InboxIcon } from "lucide-react"

import { EmptyState } from "@/components/dashboard/shared/empty-state"
import { render, screen } from "@/test-utils"

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="No items found" />)
    expect(screen.getByText("No items found")).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(
      <EmptyState
        title="No items found"
        description="Try adding some items to get started"
      />,
    )
    expect(
      screen.getByText("Try adding some items to get started"),
    ).toBeInTheDocument()
  })

  it("does not render description when not provided", () => {
    const { container } = render(<EmptyState title="No items found" />)
    expect(container.querySelector("p")).not.toBeInTheDocument()
  })

  it("renders icon when provided", () => {
    render(
      <EmptyState
        title="No items found"
        icon={<InboxIcon data-testid="inbox-icon" />}
      />,
    )
    expect(screen.getByTestId("inbox-icon")).toBeInTheDocument()
  })

  it("renders action when provided", () => {
    render(
      <EmptyState title="No items found" action={<button>Add Item</button>} />,
    )
    expect(
      screen.getByRole("button", { name: /add item/i }),
    ).toBeInTheDocument()
  })

  it("renders all props together", () => {
    render(
      <EmptyState
        title="No feeds yet"
        description="Subscribe to your first RSS feed"
        icon={<InboxIcon data-testid="inbox-icon" />}
        action={<button>Add Feed</button>}
      />,
    )

    expect(screen.getByText("No feeds yet")).toBeInTheDocument()
    expect(
      screen.getByText("Subscribe to your first RSS feed"),
    ).toBeInTheDocument()
    expect(screen.getByTestId("inbox-icon")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /add feed/i }),
    ).toBeInTheDocument()
  })

  it("applies custom className", () => {
    render(<EmptyState title="Test" className="custom-class" />)
    const element = screen.getByText("Test").parentElement
    expect(element).toHaveClass("custom-class")
  })
})
