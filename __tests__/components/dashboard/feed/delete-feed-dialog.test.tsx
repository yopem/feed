import React from "react"
import { userEvent } from "@testing-library/user-event"

import { DeleteFeedDialog } from "@/components/dashboard/feed/delete-feed-dialog"
import { render, screen } from "@/test-utils"

const mockInvalidateQueries = jest.fn()
const mockMutate = jest.fn()

jest.mock("@/lib/trpc/client", () => ({
  useTRPC: jest.fn(() => ({
    feed: {
      delete: {
        mutationOptions: jest.fn((opts) => ({
          mutationFn: mockMutate,
          ...opts,
        })),
      },
      pathFilter: jest.fn(() => ({ queryKey: ["feed"] })),
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
    useMutation: jest.fn((options) => ({
      mutate: mockMutate,
      isPending: false,
      ...options,
    })),
    useQueryClient: jest.fn(() => ({
      invalidateQueries: mockInvalidateQueries,
    })),
  }
})

describe("DeleteFeedDialog", () => {
  const mockOnClose = jest.fn()
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    feedId: "feed-1",
    feedTitle: "Test Feed",
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Rendering", () => {
    it("renders dialog when isOpen is true", () => {
      render(<DeleteFeedDialog {...defaultProps} />)
      expect(screen.getByText("Delete Feed")).toBeInTheDocument()
      expect(
        screen.getByText(/Are you sure you want to delete "Test Feed"?/),
      ).toBeInTheDocument()
    })

    it("does not render dialog when isOpen is false", () => {
      render(<DeleteFeedDialog {...defaultProps} isOpen={false} />)
      expect(screen.queryByText("Delete Feed")).not.toBeInTheDocument()
    })

    it("displays feed title in confirmation message", () => {
      render(<DeleteFeedDialog {...defaultProps} feedTitle="My Custom Feed" />)
      expect(
        screen.getByText(/Are you sure you want to delete "My Custom Feed"?/),
      ).toBeInTheDocument()
    })

    it("renders cancel button", () => {
      render(<DeleteFeedDialog {...defaultProps} />)
      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument()
    })

    it("renders delete button", () => {
      render(<DeleteFeedDialog {...defaultProps} />)
      expect(
        screen.getByRole("button", { name: /delete/i }),
      ).toBeInTheDocument()
    })

    it("shows warning about permanent deletion", () => {
      render(<DeleteFeedDialog {...defaultProps} />)
      expect(
        screen.getByText(
          /This will permanently remove the feed and all its articles/,
        ),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/This action cannot be undone/),
      ).toBeInTheDocument()
    })
  })

  describe("Delete Action", () => {
    it("calls delete mutation when delete button clicked", async () => {
      const user = userEvent.setup()
      render(<DeleteFeedDialog {...defaultProps} />)

      const deleteButton = screen.getByRole("button", { name: /delete/i })
      await user.click(deleteButton)

      expect(mockMutate).toHaveBeenCalledWith("feed-1")
    })

    it("passes correct feedId to mutation", async () => {
      const user = userEvent.setup()
      render(<DeleteFeedDialog {...defaultProps} feedId="custom-feed-id" />)

      const deleteButton = screen.getByRole("button", { name: /delete/i })
      await user.click(deleteButton)

      expect(mockMutate).toHaveBeenCalledWith("custom-feed-id")
    })
  })

  describe("Dialog Close", () => {
    it("calls onClose when cancel button clicked", async () => {
      const user = userEvent.setup()
      render(<DeleteFeedDialog {...defaultProps} />)

      const cancelButton = screen.getByRole("button", { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it("renders dialog content correctly", () => {
      render(<DeleteFeedDialog {...defaultProps} />)

      expect(screen.getByText("Delete Feed")).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: /delete/i }),
      ).toBeInTheDocument()
    })
  })

  describe("Loading States", () => {
    it("disables buttons during deletion", () => {
      const useMutation = require("@tanstack/react-query").useMutation
      useMutation.mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      })

      render(<DeleteFeedDialog {...defaultProps} />)

      expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled()
      expect(screen.getByRole("button", { name: /deleting/i })).toBeDisabled()
    })

    it("shows loading text during deletion", () => {
      const useMutation = require("@tanstack/react-query").useMutation
      useMutation.mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      })

      render(<DeleteFeedDialog {...defaultProps} />)

      expect(screen.getByText("Deleting...")).toBeInTheDocument()
    })

    it("shows normal text when not deleting", () => {
      const useMutation = require("@tanstack/react-query").useMutation
      useMutation.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      })

      render(<DeleteFeedDialog {...defaultProps} />)
      expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("has proper alert dialog role", () => {
      render(<DeleteFeedDialog {...defaultProps} />)
      expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    })

    it("has proper heading", () => {
      render(<DeleteFeedDialog {...defaultProps} />)
      expect(
        screen.getByRole("heading", { name: "Delete Feed" }),
      ).toBeInTheDocument()
    })
  })
})
