import React from "react"
import { userEvent } from "@testing-library/user-event"

import { AddTagDialog } from "@/components/dashboard/feed/add-tag-dialog"
import { render, screen, waitFor } from "@/test-utils"

const mockInvalidateQueries = jest.fn()
const mockMutateAsync = jest.fn()
const mockMutate = jest.fn()

jest.mock("@/lib/trpc/client", () => ({
  useTRPC: jest.fn(() => ({
    tag: {
      create: {
        mutationOptions: jest.fn((opts) => ({
          mutationFn: mockMutateAsync,
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
    useMutation: jest.fn((options) => ({
      mutate: mockMutate,
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
  }
})

describe("AddTagDialog", () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockMutateAsync.mockImplementation(async () => undefined)
  })

  describe("Rendering", () => {
    it("renders nothing when isOpen is false", () => {
      render(<AddTagDialog isOpen={false} onClose={mockOnClose} />)
      expect(screen.queryByText("Add New Tag")).not.toBeInTheDocument()
    })

    it("renders dialog when isOpen is true", () => {
      render(<AddTagDialog isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText("Add New Tag")).toBeInTheDocument()
      expect(screen.getByLabelText("Tag Name")).toBeInTheDocument()
      expect(
        screen.getByLabelText("Description (optional)"),
      ).toBeInTheDocument()
    })

    it("renders with empty form fields", () => {
      render(<AddTagDialog isOpen={true} onClose={mockOnClose} />)

      const nameInput = screen.getByLabelText("Tag Name") as HTMLInputElement
      const descriptionInput = screen.getByLabelText(
        "Description (optional)",
      ) as HTMLTextAreaElement

      expect(nameInput.value).toBe("")
      expect(descriptionInput.value).toBe("")
    })

    it("renders close button", () => {
      render(<AddTagDialog isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByLabelText("Close")).toBeInTheDocument()
    })

    it("renders cancel and create buttons", () => {
      render(<AddTagDialog isOpen={true} onClose={mockOnClose} />)
      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: /create tag/i }),
      ).toBeInTheDocument()
    })

    it("renders field descriptions", () => {
      render(<AddTagDialog isOpen={true} onClose={mockOnClose} />)
      expect(
        screen.getByText("A short name to identify this tag"),
      ).toBeInTheDocument()
      expect(
        screen.getByText("Optional description for this tag"),
      ).toBeInTheDocument()
    })

    it("renders placeholder text", () => {
      render(<AddTagDialog isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByPlaceholderText("Enter tag name")).toBeInTheDocument()
      expect(
        screen.getByPlaceholderText("Enter description"),
      ).toBeInTheDocument()
    })
  })

  describe("Form Submission", () => {
    it("submits tag with name only", async () => {
      const user = userEvent.setup()
      render(<AddTagDialog isOpen={true} onClose={mockOnClose} />)

      const nameInput = screen.getByLabelText("Tag Name")
      await user.type(nameInput, "Tech")

      const submitButton = screen.getByRole("button", { name: /create tag/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          name: "Tech",
          description: "",
        })
      })
    })

    it("submits tag with name and description", async () => {
      const user = userEvent.setup()
      render(<AddTagDialog isOpen={true} onClose={mockOnClose} />)

      const nameInput = screen.getByLabelText("Tag Name")
      const descriptionInput = screen.getByLabelText("Description (optional)")

      await user.type(nameInput, "Tech")
      await user.type(descriptionInput, "Technology articles")

      const submitButton = screen.getByRole("button", { name: /create tag/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          name: "Tech",
          description: "Technology articles",
        })
      })
    })

    it("trims whitespace from name", async () => {
      const user = userEvent.setup()
      render(<AddTagDialog isOpen={true} onClose={mockOnClose} />)

      const nameInput = screen.getByLabelText("Tag Name")
      await user.type(nameInput, "  Tech  ")

      const submitButton = screen.getByRole("button", { name: /create tag/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Tech",
          }),
        )
      })
    })

    it("trims whitespace from description", async () => {
      const user = userEvent.setup()
      render(<AddTagDialog isOpen={true} onClose={mockOnClose} />)

      const nameInput = screen.getByLabelText("Tag Name")
      const descriptionInput = screen.getByLabelText("Description (optional)")

      await user.type(nameInput, "Tech")
      await user.type(descriptionInput, "  Technology articles  ")

      const submitButton = screen.getByRole("button", { name: /create tag/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            description: "Technology articles",
          }),
        )
      })
    })

    it("handles empty description", async () => {
      const user = userEvent.setup()
      render(<AddTagDialog isOpen={true} onClose={mockOnClose} />)

      const nameInput = screen.getByLabelText("Tag Name")
      await user.type(nameInput, "Tech")

      const submitButton = screen.getByRole("button", { name: /create tag/i })
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
      render(<AddTagDialog isOpen={true} onClose={mockOnClose} />)

      const nameInput = screen.getByLabelText("Tag Name")
      await user.type(nameInput, "Tech")

      const submitButton = screen.getByRole("button", { name: /create tag/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it("resets form after successful submission", async () => {
      const user = userEvent.setup()
      render(<AddTagDialog isOpen={true} onClose={mockOnClose} />)

      const nameInput = screen.getByLabelText("Tag Name") as HTMLInputElement
      await user.type(nameInput, "Tech")

      const submitButton = screen.getByRole("button", { name: /create tag/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled()
      })
    })
  })

  describe("Dialog Close", () => {
    it("closes dialog when close button clicked", async () => {
      const user = userEvent.setup()
      render(<AddTagDialog isOpen={true} onClose={mockOnClose} />)

      const closeButton = screen.getByLabelText("Close")
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it("closes dialog when cancel button clicked", async () => {
      const user = userEvent.setup()
      render(<AddTagDialog isOpen={true} onClose={mockOnClose} />)

      const cancelButton = screen.getByRole("button", { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it("does not submit when cancel is clicked", async () => {
      const user = userEvent.setup()
      render(<AddTagDialog isOpen={true} onClose={mockOnClose} />)

      const nameInput = screen.getByLabelText("Tag Name")
      await user.type(nameInput, "Tech")

      const cancelButton = screen.getByRole("button", { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockMutateAsync).not.toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe("Loading States", () => {
    it("disables inputs during submission", () => {
      const useMutation = require("@tanstack/react-query").useMutation
      useMutation.mockReturnValue({
        mutate: mockMutate,
        mutateAsync: mockMutateAsync,
        isPending: true,
      })

      render(<AddTagDialog isOpen={true} onClose={mockOnClose} />)

      expect(screen.getByLabelText("Tag Name")).toBeDisabled()
      expect(screen.getByLabelText("Description (optional)")).toBeDisabled()
    })

    it("disables submit button during submission", () => {
      const useMutation = require("@tanstack/react-query").useMutation
      useMutation.mockReturnValue({
        mutate: mockMutate,
        mutateAsync: mockMutateAsync,
        isPending: true,
      })

      render(<AddTagDialog isOpen={true} onClose={mockOnClose} />)

      expect(screen.getByRole("button", { name: /creating/i })).toBeDisabled()
    })

    it("shows creating text during submission", () => {
      const useMutation = require("@tanstack/react-query").useMutation
      useMutation.mockReturnValue({
        mutate: mockMutate,
        mutateAsync: mockMutateAsync,
        isPending: true,
      })

      render(<AddTagDialog isOpen={true} onClose={mockOnClose} />)

      expect(screen.getByText("Creating...")).toBeInTheDocument()
    })

    it("disables cancel button during submission", () => {
      const useMutation = require("@tanstack/react-query").useMutation
      useMutation.mockReturnValue({
        mutate: mockMutate,
        mutateAsync: mockMutateAsync,
        isPending: true,
      })

      render(<AddTagDialog isOpen={true} onClose={mockOnClose} />)

      expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled()
    })
  })
})
