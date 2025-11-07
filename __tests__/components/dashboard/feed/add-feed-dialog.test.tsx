import React from "react"
import { userEvent } from "@testing-library/user-event"

import { AddFeedDialog } from "@/components/dashboard/feed/add-feed-dialog"
import { render, screen, waitFor } from "@/test-utils"

const mockInvalidateQueries = jest.fn()
const mockMutateAsync = jest.fn()
const mockMutate = jest.fn()

jest.mock("@/lib/trpc/client", () => ({
  useTRPC: jest.fn(() => ({
    feed: {
      create: {
        mutationOptions: jest.fn((opts) => ({
          mutationFn: mockMutateAsync,
          ...opts,
        })),
      },
      assignTags: {
        mutationOptions: jest.fn((opts) => ({
          mutationFn: jest.fn(),
          ...opts,
        })),
      },
      pathFilter: jest.fn(() => ({ queryKey: ["feed"] })),
    },
    tag: {
      all: {
        queryOptions: jest.fn(() => ({
          queryKey: ["tag", "all"],
          queryFn: jest.fn(),
        })),
      },
      create: {
        mutationOptions: jest.fn((opts) => ({
          mutationFn: mockMutate,
          ...opts,
        })),
      },
      pathFilter: jest.fn(() => ({ queryKey: ["tag"] })),
    },
    article: {
      pathFilter: jest.fn(() => ({ queryKey: ["article"] })),
    },
  })),
}))

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query")
  return {
    ...actual,
    useQuery: jest.fn((options) => {
      if (options.queryKey[0] === "tag") {
        return {
          data: [
            { id: "1", name: "Tech", userId: "user1", createdAt: new Date() },
            { id: "2", name: "News", userId: "user1", createdAt: new Date() },
          ],
        }
      }
      return { data: undefined }
    }),
    useMutation: jest.fn((options) => ({
      mutate: mockMutate,
      mutateAsync: mockMutateAsync,
      isPending: false,
      ...options,
    })),
    useQueryClient: jest.fn(() => ({
      invalidateQueries: mockInvalidateQueries,
    })),
  }
})

describe("AddFeedDialog", () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockMutateAsync.mockResolvedValue({ id: "feed1", title: "Test Feed" })
  })

  describe("Rendering", () => {
    it("renders nothing when isOpen is false", () => {
      render(<AddFeedDialog isOpen={false} onClose={mockOnClose} />)
      expect(screen.queryByText("Add New Feed")).not.toBeInTheDocument()
    })

    it("renders dialog when isOpen is true", () => {
      render(<AddFeedDialog isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText("Add New Feed")).toBeInTheDocument()
      expect(screen.getByLabelText("RSS/Atom Feed URL")).toBeInTheDocument()
      expect(screen.getByText("Tags (optional)")).toBeInTheDocument()
    })

    it("renders close button", () => {
      render(<AddFeedDialog isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByLabelText("Close")).toBeInTheDocument()
    })

    it("renders submit and cancel buttons", () => {
      render(<AddFeedDialog isOpen={true} onClose={mockOnClose} />)
      expect(
        screen.getByRole("button", { name: /add feed/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument()
    })
  })

  describe("Form Submission", () => {
    it("submits valid URL successfully", async () => {
      const user = userEvent.setup()
      render(<AddFeedDialog isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByLabelText("RSS/Atom Feed URL")
      await user.type(input, "https://example.com/feed.xml")

      const submitButton = screen.getByRole("button", { name: /add feed/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          "https://example.com/feed.xml",
        )
      })
    })

    it("trims whitespace from URL before submission", async () => {
      const user = userEvent.setup()
      render(<AddFeedDialog isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByLabelText("RSS/Atom Feed URL")
      await user.type(input, "  https://example.com/feed.xml  ")

      const submitButton = screen.getByRole("button", { name: /add feed/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          "https://example.com/feed.xml",
        )
      })
    })

    it("closes dialog after successful submission", async () => {
      const user = userEvent.setup()
      render(<AddFeedDialog isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByLabelText("RSS/Atom Feed URL")
      await user.type(input, "https://example.com/feed.xml")

      const submitButton = screen.getByRole("button", { name: /add feed/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it("resets form after successful submission", async () => {
      const user = userEvent.setup()
      render(<AddFeedDialog isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByLabelText(
        "RSS/Atom Feed URL",
      ) as HTMLInputElement
      await user.type(input, "https://example.com/feed.xml")

      const submitButton = screen.getByRole("button", { name: /add feed/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })
  })

  describe("URL Validation", () => {
    it("shows error for empty URL", async () => {
      const user = userEvent.setup()
      render(<AddFeedDialog isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByLabelText("RSS/Atom Feed URL")
      await user.type(input, "a")
      await user.clear(input)
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText("Feed URL is required")).toBeInTheDocument()
      })
    })

    it("shows error for invalid URL format", async () => {
      const user = userEvent.setup()
      render(<AddFeedDialog isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByLabelText("RSS/Atom Feed URL")
      await user.type(input, "not-a-url")
      await user.tab()

      await waitFor(() => {
        expect(
          screen.getByText(
            "Please enter a valid HTTP or HTTPS URL with a valid domain",
          ),
        ).toBeInTheDocument()
      })
    })

    it("shows error for non-HTTP protocol", async () => {
      const user = userEvent.setup()
      render(<AddFeedDialog isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByLabelText("RSS/Atom Feed URL")
      await user.type(input, "ftp://example.com/feed.xml")
      await user.tab()

      await waitFor(() => {
        expect(
          screen.getByText(
            "Please enter a valid HTTP or HTTPS URL with a valid domain",
          ),
        ).toBeInTheDocument()
      })
    })

    it("accepts valid HTTP URL", async () => {
      const user = userEvent.setup()
      render(<AddFeedDialog isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByLabelText("RSS/Atom Feed URL")
      await user.type(input, "http://example.com/feed.xml")
      await user.tab()

      await waitFor(() => {
        expect(
          screen.queryByText(
            "Please enter a valid HTTP or HTTPS URL with a valid domain",
          ),
        ).not.toBeInTheDocument()
      })
    })

    it("accepts valid HTTPS URL", async () => {
      const user = userEvent.setup()
      render(<AddFeedDialog isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByLabelText("RSS/Atom Feed URL")
      await user.type(input, "https://example.com/feed.xml")
      await user.tab()

      await waitFor(() => {
        expect(
          screen.queryByText(
            "Please enter a valid HTTP or HTTPS URL with a valid domain",
          ),
        ).not.toBeInTheDocument()
      })
    })

    it("accepts localhost URL", async () => {
      const user = userEvent.setup()
      render(<AddFeedDialog isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByLabelText("RSS/Atom Feed URL")
      await user.type(input, "http://localhost:3000/feed.xml")
      await user.tab()

      await waitFor(() => {
        expect(
          screen.queryByText(
            "Please enter a valid HTTP or HTTPS URL with a valid domain",
          ),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe("Tag Management", () => {
    it("shows tag search input", () => {
      render(<AddFeedDialog isOpen={true} onClose={mockOnClose} />)
      expect(
        screen.getByPlaceholderText("Search or create tag..."),
      ).toBeInTheDocument()
    })

    it("shows dropdown when typing in tag search", async () => {
      const user = userEvent.setup()
      render(<AddFeedDialog isOpen={true} onClose={mockOnClose} />)

      const tagInput = screen.getByPlaceholderText("Search or create tag...")
      await user.type(tagInput, "Tech")

      await waitFor(() => {
        expect(screen.getByText("Tech")).toBeInTheDocument()
      })
    })

    it("filters tags based on search query", async () => {
      const user = userEvent.setup()
      render(<AddFeedDialog isOpen={true} onClose={mockOnClose} />)

      const tagInput = screen.getByPlaceholderText("Search or create tag...")
      await user.type(tagInput, "Tech")

      await waitFor(() => {
        expect(screen.getByText("Tech")).toBeInTheDocument()
        expect(screen.queryByText("News")).not.toBeInTheDocument()
      })
    })

    it("shows create new tag option when no exact match", async () => {
      const user = userEvent.setup()
      render(<AddFeedDialog isOpen={true} onClose={mockOnClose} />)

      const tagInput = screen.getByPlaceholderText("Search or create tag...")
      await user.type(tagInput, "NewTag")

      await waitFor(() => {
        expect(screen.getByText(/Create "NewTag"/)).toBeInTheDocument()
      })
    })

    it("adds selected tag to feed", async () => {
      const user = userEvent.setup()
      render(<AddFeedDialog isOpen={true} onClose={mockOnClose} />)

      const tagInput = screen.getByPlaceholderText("Search or create tag...")
      await user.type(tagInput, "Tech")

      await waitFor(() => {
        expect(screen.getByText("Tech")).toBeInTheDocument()
      })

      const tagOption = screen.getByText("Tech")
      await user.click(tagOption)

      await waitFor(() => {
        const badges = screen.getAllByText("Tech")
        expect(badges.length).toBeGreaterThan(0)
      })
    })

    it("removes tag when badge is clicked", async () => {
      const user = userEvent.setup()
      render(<AddFeedDialog isOpen={true} onClose={mockOnClose} />)

      const tagInput = screen.getByPlaceholderText("Search or create tag...")
      await user.type(tagInput, "Tech")

      await waitFor(() => {
        expect(screen.getByText("Tech")).toBeInTheDocument()
      })

      const tagOption = screen.getByText("Tech")
      await user.click(tagOption)

      await waitFor(() => {
        const badges = screen.getAllByText("Tech")
        expect(badges.length).toBeGreaterThan(0)
      })

      const badge = screen.getAllByText("Tech")[0]
      if (badge.parentElement) {
        await user.click(badge.parentElement)
      }
    })
  })

  describe("Dialog Close", () => {
    it("closes dialog when close button clicked", async () => {
      const user = userEvent.setup()
      render(<AddFeedDialog isOpen={true} onClose={mockOnClose} />)

      const closeButton = screen.getByLabelText("Close")
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it("closes dialog when cancel button clicked", async () => {
      const user = userEvent.setup()
      render(<AddFeedDialog isOpen={true} onClose={mockOnClose} />)

      const cancelButton = screen.getByRole("button", { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it("resets form when cancel button clicked", async () => {
      const user = userEvent.setup()
      render(<AddFeedDialog isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByLabelText(
        "RSS/Atom Feed URL",
      ) as HTMLInputElement
      await user.type(input, "https://example.com/feed.xml")

      const cancelButton = screen.getByRole("button", { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe("Loading States", () => {
    it("disables submit button during submission", async () => {
      const user = userEvent.setup()
      mockMutateAsync.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ id: "feed1" }), 100),
          ),
      )

      render(<AddFeedDialog isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByLabelText("RSS/Atom Feed URL")
      await user.type(input, "https://example.com/feed.xml")

      const submitButton = screen.getByRole("button", { name: /add feed/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled()
      })
    })

    it("shows loading text during submission", async () => {
      const user = userEvent.setup()
      mockMutateAsync.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ id: "feed1" }), 100),
          ),
      )

      render(<AddFeedDialog isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByLabelText("RSS/Atom Feed URL")
      await user.type(input, "https://example.com/feed.xml")

      const submitButton = screen.getByRole("button", { name: /add feed/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled()
      })
    })
  })
})
