import userEvent from "@testing-library/user-event"
import { toast } from "sonner"

import { DeleteTagDialog } from "@/components/dashboard/feed/delete-tag-dialog"
import { render, screen, waitFor } from "@/test-utils"

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

const mockOnClose = jest.fn()
const mockMutate = jest.fn()
const mockInvalidateQueries = jest.fn()

jest.mock("@/lib/trpc/client", () => ({
  useTRPC: jest.fn(() => ({
    tag: {
      delete: {
        mutationOptions: jest.fn((options) => ({
          mutationFn: mockMutate,
          ...options,
        })),
      },
      pathFilter: jest.fn(() => ({ queryKey: ["tag"] })),
    },
    feed: {
      pathFilter: jest.fn(() => ({ queryKey: ["feed"] })),
    },
  })),
}))

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn((options) => ({
    mutate: async (tagId: string) => {
      try {
        await mockMutate(tagId)
        if (options?.onSuccess) {
          await options.onSuccess()
        }
      } catch (error) {
        if (options?.onError) {
          options.onError(error)
        }
      }
    },
    isPending: false,
  })),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
  })),
}))

describe("DeleteTagDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Rendering", () => {
    it("renders nothing when isOpen is false", () => {
      render(
        <DeleteTagDialog
          isOpen={false}
          onClose={mockOnClose}
          tagId="tag-1"
          tagName="Tech"
        />,
      )

      expect(screen.queryByText("Delete Tag")).not.toBeInTheDocument()
    })

    it("renders dialog when isOpen is true", () => {
      render(
        <DeleteTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          tagName="Tech"
        />,
      )

      expect(screen.getByText("Delete Tag")).toBeInTheDocument()
    })

    it("renders tag name in confirmation message", () => {
      render(
        <DeleteTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          tagName="Tech"
        />,
      )

      expect(
        screen.getByText(/Are you sure you want to delete "Tech"\?/),
      ).toBeInTheDocument()
    })

    it("renders warning about removing tag from feeds", () => {
      render(
        <DeleteTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          tagName="Tech"
        />,
      )

      expect(
        screen.getByText(/This will remove the tag from all feeds/),
      ).toBeInTheDocument()
    })

    it("renders cancel and delete buttons", () => {
      render(
        <DeleteTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          tagName="Tech"
        />,
      )

      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: /^delete$/i }),
      ).toBeInTheDocument()
    })

    it("renders delete button with destructive styling", () => {
      render(
        <DeleteTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          tagName="Tech"
        />,
      )

      const deleteButton = screen.getByRole("button", { name: /^delete$/i })
      expect(deleteButton).toHaveClass("bg-destructive")
    })
  })

  describe("Tag Deletion", () => {
    it("calls delete mutation with tag ID when delete button clicked", async () => {
      const user = userEvent.setup()
      render(
        <DeleteTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          tagName="Tech"
        />,
      )

      const deleteButton = screen.getByRole("button", { name: /^delete$/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith("tag-1")
      })
    })

    it("invalidates tag queries after successful deletion", async () => {
      const user = userEvent.setup()
      render(
        <DeleteTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          tagName="Tech"
        />,
      )

      const deleteButton = screen.getByRole("button", { name: /^delete$/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(mockInvalidateQueries).toHaveBeenCalledWith({
          queryKey: ["tag"],
        })
      })
    })

    it("invalidates feed queries after successful deletion", async () => {
      const user = userEvent.setup()
      render(
        <DeleteTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          tagName="Tech"
        />,
      )

      const deleteButton = screen.getByRole("button", { name: /^delete$/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(mockInvalidateQueries).toHaveBeenCalledWith({
          queryKey: ["feed"],
        })
      })
    })

    it("shows success toast after successful deletion", async () => {
      const user = userEvent.setup()
      render(
        <DeleteTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          tagName="Tech"
        />,
      )

      const deleteButton = screen.getByRole("button", { name: /^delete$/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Tag deleted successfully")
      })
    })

    it("closes dialog after successful deletion", async () => {
      const user = userEvent.setup()
      render(
        <DeleteTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          tagName="Tech"
        />,
      )

      const deleteButton = screen.getByRole("button", { name: /^delete$/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })
  })

  describe("Dialog Close", () => {
    it("closes dialog when cancel button clicked", async () => {
      const user = userEvent.setup()
      render(
        <DeleteTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          tagName="Tech"
        />,
      )

      const cancelButton = screen.getByRole("button", { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it("does not call delete mutation when cancel is clicked", async () => {
      const user = userEvent.setup()
      render(
        <DeleteTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          tagName="Tech"
        />,
      )

      const cancelButton = screen.getByRole("button", { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockMutate).not.toHaveBeenCalled()
    })
  })
})
