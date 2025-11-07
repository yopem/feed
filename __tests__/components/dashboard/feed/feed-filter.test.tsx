import userEvent from "@testing-library/user-event"

import {
  FeedFilter,
  type FilterType,
} from "@/components/dashboard/feed/feed-filter"
import { render, screen } from "@/test-utils"

describe("FeedFilter", () => {
  const mockOnFilterChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Rendering", () => {
    it("renders all filter buttons", () => {
      render(
        <FeedFilter activeFilter="all" onFilterChange={mockOnFilterChange} />,
      )

      expect(screen.getByRole("button", { name: /all/i })).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: /unread/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: /starred/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: /read later/i }),
      ).toBeInTheDocument()
    })

    it("highlights active filter", () => {
      render(
        <FeedFilter
          activeFilter="unread"
          onFilterChange={mockOnFilterChange}
        />,
      )

      const unreadButton = screen.getByRole("button", { name: /unread/i })
      expect(unreadButton).toHaveClass("bg-primary")
    })

    it("renders without counts when not provided", () => {
      render(
        <FeedFilter activeFilter="all" onFilterChange={mockOnFilterChange} />,
      )

      const allButton = screen.getByRole("button", { name: /^all$/i })
      expect(allButton.textContent).toBe("All")
    })

    it("renders with counts when provided", () => {
      const counts = {
        all: 100,
        unread: 50,
        starred: 10,
        readLater: 5,
      }

      render(
        <FeedFilter
          activeFilter="all"
          onFilterChange={mockOnFilterChange}
          counts={counts}
        />,
      )

      expect(screen.getByText("100")).toBeInTheDocument()
      expect(screen.getByText("50")).toBeInTheDocument()
      expect(screen.getByText("10")).toBeInTheDocument()
      expect(screen.getByText("5")).toBeInTheDocument()
    })

    it("hides count badge when count is 0", () => {
      const counts = {
        all: 100,
        unread: 0,
        starred: 10,
        readLater: 0,
      }

      render(
        <FeedFilter
          activeFilter="all"
          onFilterChange={mockOnFilterChange}
          counts={counts}
        />,
      )

      expect(screen.getByText("100")).toBeInTheDocument()
      expect(screen.queryByText("0")).not.toBeInTheDocument()
      expect(screen.getByText("10")).toBeInTheDocument()
    })

    it("renders badges with secondary variant for active filter", () => {
      const counts = {
        all: 100,
        unread: 50,
        starred: 10,
        readLater: 5,
      }

      render(
        <FeedFilter
          activeFilter="unread"
          onFilterChange={mockOnFilterChange}
          counts={counts}
        />,
      )

      const unreadBadge = screen.getByText("50")
      expect(unreadBadge).toHaveClass("bg-secondary")
    })

    it("renders badges with outline variant for inactive filters", () => {
      const counts = {
        all: 100,
        unread: 50,
        starred: 10,
        readLater: 5,
      }

      render(
        <FeedFilter
          activeFilter="all"
          onFilterChange={mockOnFilterChange}
          counts={counts}
        />,
      )

      const unreadBadge = screen.getByText("50")
      expect(unreadBadge).toBeInTheDocument()
    })
  })

  describe("Filter Interaction", () => {
    it("calls onFilterChange when All button clicked", async () => {
      const user = userEvent.setup()
      render(
        <FeedFilter
          activeFilter="unread"
          onFilterChange={mockOnFilterChange}
        />,
      )

      const allButton = screen.getByRole("button", { name: /all/i })
      await user.click(allButton)

      expect(mockOnFilterChange).toHaveBeenCalledWith("all")
    })

    it("calls onFilterChange when Unread button clicked", async () => {
      const user = userEvent.setup()
      render(
        <FeedFilter activeFilter="all" onFilterChange={mockOnFilterChange} />,
      )

      const unreadButton = screen.getByRole("button", { name: /unread/i })
      await user.click(unreadButton)

      expect(mockOnFilterChange).toHaveBeenCalledWith("unread")
    })

    it("calls onFilterChange when Starred button clicked", async () => {
      const user = userEvent.setup()
      render(
        <FeedFilter activeFilter="all" onFilterChange={mockOnFilterChange} />,
      )

      const starredButton = screen.getByRole("button", { name: /starred/i })
      await user.click(starredButton)

      expect(mockOnFilterChange).toHaveBeenCalledWith("starred")
    })

    it("calls onFilterChange when Read Later button clicked", async () => {
      const user = userEvent.setup()
      render(
        <FeedFilter activeFilter="all" onFilterChange={mockOnFilterChange} />,
      )

      const readLaterButton = screen.getByRole("button", {
        name: /read later/i,
      })
      await user.click(readLaterButton)

      expect(mockOnFilterChange).toHaveBeenCalledWith("readLater")
    })

    it("allows clicking the same filter multiple times", async () => {
      const user = userEvent.setup()
      render(
        <FeedFilter activeFilter="all" onFilterChange={mockOnFilterChange} />,
      )

      const allButton = screen.getByRole("button", { name: /all/i })
      await user.click(allButton)
      await user.click(allButton)

      expect(mockOnFilterChange).toHaveBeenCalledTimes(2)
      expect(mockOnFilterChange).toHaveBeenCalledWith("all")
    })

    it("switches between filters correctly", async () => {
      const user = userEvent.setup()
      const { rerender } = render(
        <FeedFilter activeFilter="all" onFilterChange={mockOnFilterChange} />,
      )

      const unreadButton = screen.getByRole("button", { name: /unread/i })
      await user.click(unreadButton)

      expect(mockOnFilterChange).toHaveBeenCalledWith("unread")

      rerender(
        <FeedFilter
          activeFilter="unread"
          onFilterChange={mockOnFilterChange}
        />,
      )

      const starredButton = screen.getByRole("button", { name: /starred/i })
      await user.click(starredButton)

      expect(mockOnFilterChange).toHaveBeenCalledWith("starred")
    })
  })

  describe("Filter Types", () => {
    const filterTypes: FilterType[] = ["all", "unread", "starred", "readLater"]

    filterTypes.forEach((filterType) => {
      it(`renders correctly with ${filterType} as active filter`, () => {
        render(
          <FeedFilter
            activeFilter={filterType}
            onFilterChange={mockOnFilterChange}
          />,
        )

        const buttons = screen.getAllByRole("button")
        expect(buttons).toHaveLength(4)
      })
    })
  })

  describe("Edge Cases", () => {
    it("renders with partial counts", () => {
      const counts = {
        all: 100,
        unread: 50,
        starred: 0,
        readLater: 0,
      }

      render(
        <FeedFilter
          activeFilter="all"
          onFilterChange={mockOnFilterChange}
          counts={counts}
        />,
      )

      expect(screen.getByText("100")).toBeInTheDocument()
      expect(screen.getByText("50")).toBeInTheDocument()
      expect(screen.queryByText("0")).not.toBeInTheDocument()
    })

    it("renders with all zero counts", () => {
      const counts = {
        all: 0,
        unread: 0,
        starred: 0,
        readLater: 0,
      }

      render(
        <FeedFilter
          activeFilter="all"
          onFilterChange={mockOnFilterChange}
          counts={counts}
        />,
      )

      expect(screen.queryByText("0")).not.toBeInTheDocument()
      expect(screen.getAllByRole("button")).toHaveLength(4)
    })

    it("renders with large count numbers", () => {
      const counts = {
        all: 99999,
        unread: 1234,
        starred: 567,
        readLater: 89,
      }

      render(
        <FeedFilter
          activeFilter="all"
          onFilterChange={mockOnFilterChange}
          counts={counts}
        />,
      )

      expect(screen.getByText("99999")).toBeInTheDocument()
      expect(screen.getByText("1234")).toBeInTheDocument()
      expect(screen.getByText("567")).toBeInTheDocument()
      expect(screen.getByText("89")).toBeInTheDocument()
    })
  })
})
