import userEvent from "@testing-library/user-event"

import { FeedItem } from "@/components/dashboard/feed/feed-item"
import { render, screen } from "@/test-utils"

describe("FeedItem", () => {
  const mockOnSelect = jest.fn()
  const mockOnEdit = jest.fn()
  const mockOnDelete = jest.fn()
  const mockOnRefresh = jest.fn()

  const defaultProps = {
    id: "feed-1",
    title: "Tech News",
    unreadCount: 5,
    isSelected: false,
    onSelect: mockOnSelect,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Rendering", () => {
    it("renders feed title", () => {
      render(<FeedItem {...defaultProps} />)
      expect(screen.getByText("Tech News")).toBeInTheDocument()
    })

    it("renders unread count badge when count > 0", () => {
      render(<FeedItem {...defaultProps} unreadCount={5} />)
      expect(screen.getByText("5")).toBeInTheDocument()
    })

    it("does not render unread count badge when count is 0", () => {
      render(<FeedItem {...defaultProps} unreadCount={0} />)
      expect(screen.queryByText("0")).not.toBeInTheDocument()
    })

    it("renders first letter as placeholder when no image provided", () => {
      render(<FeedItem {...defaultProps} />)
      expect(screen.getByText("T")).toBeInTheDocument()
    })

    it("renders image when imageUrl provided", () => {
      render(
        <FeedItem {...defaultProps} imageUrl="https://example.com/image.jpg" />,
      )

      const image = screen.getByAltText("Tech News")
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute("src")
    })

    it("renders with selected styling when isSelected is true", () => {
      const { container } = render(
        <FeedItem {...defaultProps} isSelected={true} />,
      )
      const card = container.querySelector('[data-slot="card"]') as HTMLElement
      expect(card).toBeInTheDocument()
      const className = card.className
      expect(className).toContain("bg-accent")
      expect(className).toContain("ring-2")
    })

    it("renders without selected styling when isSelected is false", () => {
      const { container } = render(
        <FeedItem {...defaultProps} isSelected={false} />,
      )
      const card = container.querySelector('[data-slot="card"]') as HTMLElement
      expect(card).toBeInTheDocument()
      const className = card.className
      expect(className).not.toContain("ring-2")
    })

    it("does not render action buttons when callbacks not provided", () => {
      render(<FeedItem {...defaultProps} />)

      expect(
        screen.queryByRole("button", { name: /edit feed/i }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole("button", { name: /delete feed/i }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole("button", { name: /refresh feed/i }),
      ).not.toBeInTheDocument()
    })

    it("renders edit button when onEdit provided", () => {
      render(<FeedItem {...defaultProps} onEdit={mockOnEdit} />)
      expect(
        screen.getByRole("button", { name: /edit feed/i }),
      ).toBeInTheDocument()
    })

    it("renders delete button when onDelete provided", () => {
      render(<FeedItem {...defaultProps} onDelete={mockOnDelete} />)
      expect(
        screen.getByRole("button", { name: /delete feed/i }),
      ).toBeInTheDocument()
    })

    it("renders refresh button when onRefresh provided", () => {
      render(<FeedItem {...defaultProps} onRefresh={mockOnRefresh} />)
      expect(
        screen.getByRole("button", { name: /refresh feed/i }),
      ).toBeInTheDocument()
    })

    it("renders all action buttons when all callbacks provided", () => {
      render(
        <FeedItem
          {...defaultProps}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRefresh={mockOnRefresh}
        />,
      )

      expect(
        screen.getByRole("button", { name: /edit feed/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: /delete feed/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: /refresh feed/i }),
      ).toBeInTheDocument()
    })
  })

  describe("Tags", () => {
    it("does not render tags section when no tags provided", () => {
      render(<FeedItem {...defaultProps} />)
      expect(screen.queryByText(/tag/i)).not.toBeInTheDocument()
    })

    it("does not render tags section when empty tags array provided", () => {
      render(<FeedItem {...defaultProps} tags={[]} />)
      expect(screen.queryByText(/tag/i)).not.toBeInTheDocument()
    })

    it("renders single tag", () => {
      const tags = [{ id: "tag-1", name: "Technology" }]
      render(<FeedItem {...defaultProps} tags={tags} />)
      expect(screen.getByText("Technology")).toBeInTheDocument()
    })

    it("renders multiple tags", () => {
      const tags = [
        { id: "tag-1", name: "Technology" },
        { id: "tag-2", name: "News" },
        { id: "tag-3", name: "Dev" },
      ]
      render(<FeedItem {...defaultProps} tags={tags} />)

      expect(screen.getByText("Technology")).toBeInTheDocument()
      expect(screen.getByText("News")).toBeInTheDocument()
      expect(screen.getByText("Dev")).toBeInTheDocument()
    })

    it("does not trigger onSelect when clicking on tag", async () => {
      const user = userEvent.setup()
      const tags = [{ id: "tag-1", name: "Technology" }]
      render(<FeedItem {...defaultProps} tags={tags} />)

      const tag = screen.getByText("Technology")
      await user.click(tag)

      expect(mockOnSelect).not.toHaveBeenCalled()
    })
  })

  describe("Interactions", () => {
    it("calls onSelect with feed id when card clicked", async () => {
      const user = userEvent.setup()
      render(<FeedItem {...defaultProps} />)

      const title = screen.getByText("Tech News")
      await user.click(title)

      expect(mockOnSelect).toHaveBeenCalledWith("feed-1")
    })

    it("calls onEdit with feed id when edit button clicked", async () => {
      const user = userEvent.setup()
      render(<FeedItem {...defaultProps} onEdit={mockOnEdit} />)

      const editButton = screen.getByRole("button", { name: /edit feed/i })
      await user.click(editButton)

      expect(mockOnEdit).toHaveBeenCalledWith("feed-1")
    })

    it("calls onDelete with feed id when delete button clicked", async () => {
      const user = userEvent.setup()
      render(<FeedItem {...defaultProps} onDelete={mockOnDelete} />)

      const deleteButton = screen.getByRole("button", { name: /delete feed/i })
      await user.click(deleteButton)

      expect(mockOnDelete).toHaveBeenCalledWith("feed-1")
    })

    it("calls onRefresh with feed id when refresh button clicked", async () => {
      const user = userEvent.setup()
      render(<FeedItem {...defaultProps} onRefresh={mockOnRefresh} />)

      const refreshButton = screen.getByRole("button", {
        name: /refresh feed/i,
      })
      await user.click(refreshButton)

      expect(mockOnRefresh).toHaveBeenCalledWith("feed-1")
    })

    it("does not call onSelect when edit button clicked", async () => {
      const user = userEvent.setup()
      render(<FeedItem {...defaultProps} onEdit={mockOnEdit} />)

      const editButton = screen.getByRole("button", { name: /edit feed/i })
      await user.click(editButton)

      expect(mockOnSelect).not.toHaveBeenCalled()
    })

    it("does not call onSelect when delete button clicked", async () => {
      const user = userEvent.setup()
      render(<FeedItem {...defaultProps} onDelete={mockOnDelete} />)

      const deleteButton = screen.getByRole("button", { name: /delete feed/i })
      await user.click(deleteButton)

      expect(mockOnSelect).not.toHaveBeenCalled()
    })

    it("does not call onSelect when refresh button clicked", async () => {
      const user = userEvent.setup()
      render(<FeedItem {...defaultProps} onRefresh={mockOnRefresh} />)

      const refreshButton = screen.getByRole("button", {
        name: /refresh feed/i,
      })
      await user.click(refreshButton)

      expect(mockOnSelect).not.toHaveBeenCalled()
    })
  })

  describe("Refresh State", () => {
    it("disables refresh button when isRefreshing is true", () => {
      render(
        <FeedItem
          {...defaultProps}
          onRefresh={mockOnRefresh}
          isRefreshing={true}
        />,
      )

      const refreshButton = screen.getByRole("button", {
        name: /refresh feed/i,
      })
      expect(refreshButton).toBeDisabled()
    })

    it("enables refresh button when isRefreshing is false", () => {
      render(
        <FeedItem
          {...defaultProps}
          onRefresh={mockOnRefresh}
          isRefreshing={false}
        />,
      )

      const refreshButton = screen.getByRole("button", {
        name: /refresh feed/i,
      })
      expect(refreshButton).not.toBeDisabled()
    })

    it("enables refresh button by default when isRefreshing not provided", () => {
      render(<FeedItem {...defaultProps} onRefresh={mockOnRefresh} />)

      const refreshButton = screen.getByRole("button", {
        name: /refresh feed/i,
      })
      expect(refreshButton).not.toBeDisabled()
    })

    it("shows spinning icon when isRefreshing is true", () => {
      render(
        <FeedItem
          {...defaultProps}
          onRefresh={mockOnRefresh}
          isRefreshing={true}
        />,
      )

      const refreshButton = screen.getByRole("button", {
        name: /refresh feed/i,
      })
      const icon = refreshButton.querySelector("svg")
      expect(icon).toHaveClass("animate-spin")
    })

    it("does not show spinning icon when isRefreshing is false", () => {
      render(
        <FeedItem
          {...defaultProps}
          onRefresh={mockOnRefresh}
          isRefreshing={false}
        />,
      )

      const refreshButton = screen.getByRole("button", {
        name: /refresh feed/i,
      })
      const icon = refreshButton.querySelector("svg")
      expect(icon).not.toHaveClass("animate-spin")
    })
  })

  describe("Edge Cases", () => {
    it("renders with long title", () => {
      const longTitle =
        "This is a very long feed title that should be truncated in the UI to prevent layout issues"
      render(<FeedItem {...defaultProps} title={longTitle} />)
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it("renders with title starting with lowercase letter", () => {
      render(<FeedItem {...defaultProps} title="tech news" />)
      expect(screen.getByText("T")).toBeInTheDocument()
    })

    it("renders with title starting with number", () => {
      render(<FeedItem {...defaultProps} title="9gag" />)
      expect(screen.getByText("9")).toBeInTheDocument()
    })

    it("renders with title starting with special character", () => {
      render(<FeedItem {...defaultProps} title="@TechNews" />)
      expect(screen.getByText("@")).toBeInTheDocument()
    })

    it("renders with very high unread count", () => {
      render(<FeedItem {...defaultProps} unreadCount={99999} />)
      expect(screen.getByText("99999")).toBeInTheDocument()
    })

    it("renders with null imageUrl", () => {
      render(<FeedItem {...defaultProps} imageUrl={null} />)
      expect(screen.getByText("T")).toBeInTheDocument()
    })

    it("renders with undefined imageUrl", () => {
      render(<FeedItem {...defaultProps} imageUrl={undefined} />)
      expect(screen.getByText("T")).toBeInTheDocument()
    })

    it("renders with many tags", () => {
      const tags = Array.from({ length: 10 }, (_, i) => ({
        id: `tag-${i}`,
        name: `Tag ${i + 1}`,
      }))
      render(<FeedItem {...defaultProps} tags={tags} />)

      tags.forEach((tag) => {
        expect(screen.getByText(tag.name)).toBeInTheDocument()
      })
    })
  })
})
