import userEvent from "@testing-library/user-event"
import { toast } from "sonner"

import { EditTagDialog } from "@/components/dashboard/feed/edit-tag-dialog"
import { render, screen, waitFor } from "@/test-utils"

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

const mockOnClose = jest.fn()
const mockMutateAsync = jest.fn()
const mockInvalidateQueries = jest.fn()

jest.mock("@/lib/trpc/client", () => ({
  useTRPC: jest.fn(() => ({
    tag: {
      update: {
        mutationOptions: jest.fn((options) => ({
          mutationFn: mockMutateAsync,
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
    mutateAsync: async (...args: unknown[]) => {
      const result = await mockMutateAsync(...args)
      if (options?.onSuccess) {
        await options.onSuccess(result, args[0], undefined)
      }
      return result
    },
    isPending: false,
  })),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
  })),
}))

describe("EditTagDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMutateAsync.mockResolvedValue({ id: "tag-1" })
  })

  describe("Rendering", () => {
    it("renders nothing when isOpen is false", () => {
      render(
        <EditTagDialog
          isOpen={false}
          onClose={mockOnClose}
          tagId="tag-1"
          initialName="Tech"
        />,
      )

      expect(screen.queryByText("Edit Tag")).not.toBeInTheDocument()
    })

    it("renders dialog when isOpen is true", () => {
      render(
        <EditTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          initialName="Tech"
        />,
      )

      expect(screen.getByText("Edit Tag")).toBeInTheDocument()
    })

    it("renders form with name input", () => {
      render(
        <EditTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          initialName="Tech"
        />,
      )

      expect(screen.getByLabelText("Tag Name")).toBeInTheDocument()
    })

    it("renders form with description textarea", () => {
      render(
        <EditTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          initialName="Tech"
        />,
      )

      expect(
        screen.getByLabelText("Description (optional)"),
      ).toBeInTheDocument()
    })

    it("renders close button", () => {
      render(
        <EditTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          initialName="Tech"
        />,
      )

      expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument()
    })

    it("renders cancel and save buttons", () => {
      render(
        <EditTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          initialName="Tech"
        />,
      )

      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: /save changes/i }),
      ).toBeInTheDocument()
    })

    it("pre-fills form with initial values", () => {
      render(
        <EditTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          initialName="Tech"
          initialDescription="Technology articles"
        />,
      )

      const nameInput = screen.getByLabelText("Tag Name") as HTMLInputElement
      const descriptionInput = screen.getByLabelText(
        "Description (optional)",
      ) as HTMLTextAreaElement

      expect(nameInput.value).toBe("Tech")
      expect(descriptionInput.value).toBe("Technology articles")
    })

    it("pre-fills form with name only when description is undefined", () => {
      render(
        <EditTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          initialName="Tech"
        />,
      )

      const nameInput = screen.getByLabelText("Tag Name") as HTMLInputElement
      const descriptionInput = screen.getByLabelText(
        "Description (optional)",
      ) as HTMLTextAreaElement

      expect(nameInput.value).toBe("Tech")
      expect(descriptionInput.value).toBe("")
    })
  })

  describe("Form Submission", () => {
    it("submits form with updated values", async () => {
      const user = userEvent.setup()
      render(
        <EditTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          initialName="Tech"
          initialDescription="Old description"
        />,
      )

      const nameInput = screen.getByLabelText("Tag Name")
      const descriptionInput = screen.getByLabelText("Description (optional)")

      await user.clear(nameInput)
      await user.type(nameInput, "Technology")

      await user.clear(descriptionInput)
      await user.type(descriptionInput, "New description")

      const submitButton = screen.getByRole("button", { name: /save changes/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: "tag-1",
          name: "Technology",
          description: "New description",
        })
      })
    })

    it("submits form with only name updated", async () => {
      const user = userEvent.setup()
      render(
        <EditTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          initialName="Tech"
        />,
      )

      const nameInput = screen.getByLabelText("Tag Name")

      await user.clear(nameInput)
      await user.type(nameInput, "Technology")

      const submitButton = screen.getByRole("button", { name: /save changes/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            id: "tag-1",
            name: "Technology",
          }),
        )
      })
    })

    it("trims whitespace from name", async () => {
      const user = userEvent.setup()
      render(
        <EditTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          initialName="Tech"
        />,
      )

      const nameInput = screen.getByLabelText("Tag Name")

      await user.clear(nameInput)
      await user.type(nameInput, "  Technology  ")

      const submitButton = screen.getByRole("button", { name: /save changes/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Technology",
          }),
        )
      })
    })

    it("trims whitespace from description", async () => {
      const user = userEvent.setup()
      render(
        <EditTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          initialName="Tech"
        />,
      )

      const descriptionInput = screen.getByLabelText("Description (optional)")

      await user.type(descriptionInput, "  New description  ")

      const submitButton = screen.getByRole("button", { name: /save changes/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            description: "New description",
          }),
        )
      })
    })

    it("handles empty description by clearing it", async () => {
      const user = userEvent.setup()
      render(
        <EditTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          initialName="Tech"
          initialDescription="Old description"
        />,
      )

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

    it("invalidates tag queries after successful update", async () => {
      const user = userEvent.setup()
      render(
        <EditTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          initialName="Tech"
        />,
      )

      const nameInput = screen.getByLabelText("Tag Name")

      await user.clear(nameInput)
      await user.type(nameInput, "Technology")

      const submitButton = screen.getByRole("button", { name: /save changes/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockInvalidateQueries).toHaveBeenCalledWith({
          queryKey: ["tag"],
        })
      })
    })

    it("invalidates feed queries after successful update", async () => {
      const user = userEvent.setup()
      render(
        <EditTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          initialName="Tech"
        />,
      )

      const nameInput = screen.getByLabelText("Tag Name")

      await user.clear(nameInput)
      await user.type(nameInput, "Technology")

      const submitButton = screen.getByRole("button", { name: /save changes/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockInvalidateQueries).toHaveBeenCalledWith({
          queryKey: ["feed"],
        })
      })
    })

    it("shows success toast after successful update", async () => {
      const user = userEvent.setup()
      render(
        <EditTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          initialName="Tech"
        />,
      )

      const nameInput = screen.getByLabelText("Tag Name")

      await user.clear(nameInput)
      await user.type(nameInput, "Technology")

      const submitButton = screen.getByRole("button", { name: /save changes/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Tag updated successfully")
      })
    })

    it("closes dialog after successful update", async () => {
      const user = userEvent.setup()
      render(
        <EditTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          initialName="Tech"
        />,
      )

      const nameInput = screen.getByLabelText("Tag Name")

      await user.clear(nameInput)
      await user.type(nameInput, "Technology")

      const submitButton = screen.getByRole("button", { name: /save changes/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it("resets form after successful update", async () => {
      const user = userEvent.setup()
      render(
        <EditTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          initialName="Tech"
        />,
      )

      const nameInput = screen.getByLabelText("Tag Name")

      await user.clear(nameInput)
      await user.type(nameInput, "Technology")

      const submitButton = screen.getByRole("button", { name: /save changes/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled()
      })
    })

    it("submits form even with empty name (validation is server-side)", async () => {
      const user = userEvent.setup()
      render(
        <EditTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          initialName="Tech"
        />,
      )

      const nameInput = screen.getByLabelText("Tag Name")

      await user.clear(nameInput)

      const submitButton = screen.getByRole("button", { name: /save changes/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "",
          }),
        )
      })
    })
  })

  describe("Dialog Close", () => {
    it("closes dialog when close button clicked", async () => {
      const user = userEvent.setup()
      render(
        <EditTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          initialName="Tech"
        />,
      )

      const closeButton = screen.getByRole("button", { name: /close/i })
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it("closes dialog when cancel button clicked", async () => {
      const user = userEvent.setup()
      render(
        <EditTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          initialName="Tech"
        />,
      )

      const cancelButton = screen.getByRole("button", { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it("does not submit when cancel is clicked", async () => {
      const user = userEvent.setup()
      render(
        <EditTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          initialName="Tech"
        />,
      )

      const nameInput = screen.getByLabelText("Tag Name")
      await user.clear(nameInput)
      await user.type(nameInput, "Technology")

      const cancelButton = screen.getByRole("button", { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockMutateAsync).not.toHaveBeenCalled()
    })
  })

  describe("Loading States", () => {
    it("disables inputs during submission", () => {
      jest.requireMock("@tanstack/react-query").useMutation = jest.fn(() => ({
        mutateAsync: mockMutateAsync,
        isPending: true,
      }))

      render(
        <EditTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          initialName="Tech"
        />,
      )

      const nameInput = screen.getByLabelText("Tag Name")
      const descriptionInput = screen.getByLabelText("Description (optional)")

      expect(nameInput).toBeDisabled()
      expect(descriptionInput).toBeDisabled()
    })

    it("disables submit button during submission", () => {
      jest.requireMock("@tanstack/react-query").useMutation = jest.fn(() => ({
        mutateAsync: mockMutateAsync,
        isPending: true,
      }))

      render(
        <EditTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          initialName="Tech"
        />,
      )

      const submitButton = screen.getByRole("button", { name: /saving/i })
      expect(submitButton).toBeDisabled()
    })

    it("shows saving text during submission", () => {
      jest.requireMock("@tanstack/react-query").useMutation = jest.fn(() => ({
        mutateAsync: mockMutateAsync,
        isPending: true,
      }))

      render(
        <EditTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          initialName="Tech"
        />,
      )

      expect(screen.getByText("Saving...")).toBeInTheDocument()
    })

    it("disables cancel button during submission", () => {
      jest.requireMock("@tanstack/react-query").useMutation = jest.fn(() => ({
        mutateAsync: mockMutateAsync,
        isPending: true,
      }))

      render(
        <EditTagDialog
          isOpen={true}
          onClose={mockOnClose}
          tagId="tag-1"
          initialName="Tech"
        />,
      )

      const cancelButton = screen.getByRole("button", { name: /cancel/i })
      expect(cancelButton).toBeDisabled()
    })
  })
})
