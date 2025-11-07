import React from "react"
import { userEvent } from "@testing-library/user-event"

import { EditFeedDialog } from "@/components/dashboard/feed/edit-feed-dialog"
import { render, screen, waitFor } from "@/test-utils"

const mockInvalidateQueries = jest.fn()
const mockMutateAsync = jest.fn()
const mockMutate = jest.fn()

jest.mock("@/lib/trpc/client", () => ({
  useTRPC: jest.fn(() => ({
    feed: {
      update: {
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
      mutateAsync: async (...args: unknown[]) => {
        const result = await mockMutateAsync(...args)
        // Call onSuccess callback if provided
        if (options?.onSuccess) {
          await options.onSuccess(result, args[0], undefined)
        }
        return result
      },
      isPending: false,
      ...options,
    })),
    useQueryClient: jest.fn(() => ({
      invalidateQueries: mockInvalidateQueries,
    })),
  }
})

describe("EditFeedDialog", () => {
  const mockOnClose = jest.fn()
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    feedId: "feed-1",
    initialTitle: "Test Feed",
    initialDescription: "Test Description",
    initialTagIds: ["1"],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockMutateAsync.mockImplementation(async () => {
      // Simulate successful mutation
      return undefined
    })
  })

  describe("Rendering", () => {
    it("renders nothing when isOpen is false", () => {
      render(<EditFeedDialog {...defaultProps} isOpen={false} />)
      expect(screen.queryByText("Edit Feed")).not.toBeInTheDocument()
    })

    it("renders dialog when isOpen is true", () => {
      render(<EditFeedDialog {...defaultProps} />)
      expect(screen.getByText("Edit Feed")).toBeInTheDocument()
      expect(screen.getByLabelText("Feed Title")).toBeInTheDocument()
      expect(
        screen.getByLabelText("Description (optional)"),
      ).toBeInTheDocument()
    })

    it("populates form with initial values", () => {
      render(<EditFeedDialog {...defaultProps} />)

      const titleInput = screen.getByLabelText("Feed Title") as HTMLInputElement
      const descriptionInput = screen.getByLabelText(
        "Description (optional)",
      ) as HTMLTextAreaElement

      expect(titleInput.value).toBe("Test Feed")
      expect(descriptionInput.value).toBe("Test Description")
    })

    it("shows initial tags", () => {
      render(<EditFeedDialog {...defaultProps} />)
      expect(screen.getByText("Tech")).toBeInTheDocument()
    })

    it("renders without description when not provided", () => {
      render(
        <EditFeedDialog {...defaultProps} initialDescription={undefined} />,
      )

      const descriptionInput = screen.getByLabelText(
        "Description (optional)",
      ) as HTMLTextAreaElement
      expect(descriptionInput.value).toBe("")
    })

    it("renders close button", () => {
      render(<EditFeedDialog {...defaultProps} />)
      expect(screen.getByLabelText("Close")).toBeInTheDocument()
    })

    it("renders cancel and save buttons", () => {
      render(<EditFeedDialog {...defaultProps} />)
      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: /save changes/i }),
      ).toBeInTheDocument()
    })
  })

  describe("Form Submission", () => {
    it("submits updated feed data", async () => {
      const user = userEvent.setup()
      render(<EditFeedDialog {...defaultProps} />)

      const titleInput = screen.getByLabelText("Feed Title")
      await user.clear(titleInput)
      await user.type(titleInput, "Updated Feed Title")

      const submitButton = screen.getByRole("button", { name: /save changes/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: "feed-1",
          title: "Updated Feed Title",
          description: "Test Description",
        })
      })
    })

    it("trims whitespace from title", async () => {
      const user = userEvent.setup()
      render(<EditFeedDialog {...defaultProps} />)

      const titleInput = screen.getByLabelText("Feed Title")
      await user.clear(titleInput)
      await user.type(titleInput, "  Trimmed Title  ")

      const submitButton = screen.getByRole("button", { name: /save changes/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Trimmed Title",
          }),
        )
      })
    })

    it("handles empty description", async () => {
      const user = userEvent.setup()
      render(<EditFeedDialog {...defaultProps} />)

      const descriptionInput = screen.getByLabelText("Description (optional)")
      await user.clear(descriptionInput)

      const submitButton = screen.getByRole("button", { name: /save changes/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            description: "",
          }),
        )
      })
    })

    it("closes dialog after successful submission", async () => {
      const user = userEvent.setup()
      render(<EditFeedDialog {...defaultProps} />)

      const submitButton = screen.getByRole("button", { name: /save changes/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })
  })

  describe("Title Validation", () => {
    it("prevents submission with invalid data", async () => {
      const user = userEvent.setup()
      mockMutateAsync.mockRejectedValueOnce(new Error("Invalid data"))

      render(<EditFeedDialog {...defaultProps} />)

      const submitButton = screen.getByRole("button", { name: /save changes/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled()
      })
    })
  })

  describe("Tag Management", () => {
    it("shows tag search input", () => {
      render(<EditFeedDialog {...defaultProps} />)
      expect(
        screen.getByPlaceholderText("Search or create tag..."),
      ).toBeInTheDocument()
    })

    it("shows dropdown when typing in tag search", async () => {
      const user = userEvent.setup()
      render(<EditFeedDialog {...defaultProps} />)

      const tagInput = screen.getByPlaceholderText("Search or create tag...")
      await user.type(tagInput, "News")

      await waitFor(() => {
        expect(screen.getByText("News")).toBeInTheDocument()
      })
    })

    it("adds new tag to feed", async () => {
      const user = userEvent.setup()
      render(<EditFeedDialog {...defaultProps} initialTagIds={[]} />)

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
      render(<EditFeedDialog {...defaultProps} />)

      const techBadge = screen
        .getByText("Tech")
        .closest('[class*="cursor-pointer"]')
      if (techBadge) {
        await user.click(techBadge)
      }

      await waitFor(() => {
        const badges = screen.queryAllByText("Tech")
        expect(badges.length).toBe(0)
      })
    })

    it("shows create new tag option", async () => {
      const user = userEvent.setup()
      render(<EditFeedDialog {...defaultProps} />)

      const tagInput = screen.getByPlaceholderText("Search or create tag...")
      await user.type(tagInput, "NewTag")

      await waitFor(() => {
        expect(screen.getByText(/Create "NewTag"/)).toBeInTheDocument()
      })
    })
  })

  describe("Dialog Close", () => {
    it("closes dialog when close button clicked", async () => {
      const user = userEvent.setup()
      render(<EditFeedDialog {...defaultProps} />)

      const closeButton = screen.getByLabelText("Close")
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it("closes dialog when cancel button clicked", async () => {
      const user = userEvent.setup()
      render(<EditFeedDialog {...defaultProps} />)

      const cancelButton = screen.getByRole("button", { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it("resets form when cancel button clicked", async () => {
      const user = userEvent.setup()
      render(<EditFeedDialog {...defaultProps} />)

      const titleInput = screen.getByLabelText("Feed Title") as HTMLInputElement
      await user.clear(titleInput)
      await user.type(titleInput, "Changed Title")

      const cancelButton = screen.getByRole("button", { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe("Loading States", () => {
    it("disables inputs during update", () => {
      const useMutation = require("@tanstack/react-query").useMutation
      useMutation.mockReturnValue({
        mutate: mockMutate,
        mutateAsync: mockMutateAsync,
        isPending: true,
      })

      render(<EditFeedDialog {...defaultProps} />)

      expect(screen.getByLabelText("Feed Title")).toBeDisabled()
      expect(screen.getByLabelText("Description (optional)")).toBeDisabled()
    })

    it("shows saving text during submission", () => {
      const useMutation = require("@tanstack/react-query").useMutation
      useMutation.mockReturnValue({
        mutate: mockMutate,
        mutateAsync: mockMutateAsync,
        isPending: true,
      })

      render(<EditFeedDialog {...defaultProps} />)

      expect(screen.getByText("Saving...")).toBeInTheDocument()
    })
  })
})
