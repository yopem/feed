import { userEvent } from "@testing-library/user-event"
import { toast } from "sonner"

import { TagManagement } from "@/components/dashboard/feed/tag-management"
import { render, screen, waitFor } from "@/test-utils"

jest.mock("sonner")
const mockToast = toast as jest.Mocked<typeof toast>

const mockInvalidateQueries = jest.fn()
const mockMutate = jest.fn()

jest.mock("@/lib/trpc/client", () => ({
  useTRPC: () => ({
    tag: {
      all: {
        queryOptions: () => ({
          queryKey: ["tag", "all"],
          queryFn: jest.fn(),
        }),
      },
      create: {
        mutationOptions: (options: {
          onSuccess: () => void
          onError: (err: { message: string }) => void
        }) => ({
          mutationFn: mockMutate,
          onSuccess: options.onSuccess,
          onError: options.onError,
        }),
      },
      update: {
        mutationOptions: (options: {
          onSuccess: () => void
          onError: (err: { message: string }) => void
        }) => ({
          mutationFn: mockMutate,
          onSuccess: options.onSuccess,
          onError: options.onError,
        }),
      },
      delete: {
        mutationOptions: (options: {
          onSuccess: () => void
          onError: (err: { message: string }) => void
        }) => ({
          mutationFn: mockMutate,
          onSuccess: options.onSuccess,
          onError: options.onError,
        }),
      },
      pathFilter: () => ({ queryKey: ["tag"] }),
    },
  }),
}))

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query")
  return {
    ...actual,
    useQuery: (options: { queryKey: string[] }) => {
      if (options.queryKey[0] === "tag" && options.queryKey[1] === "all") {
        return {
          data: [
            { id: "1", name: "Technology", description: "Tech related feeds" },
            { id: "2", name: "Science", description: null },
          ],
          isLoading: false,
        }
      }
      return { data: undefined, isLoading: false }
    },
    useMutation: (options: {
      mutationFn: () => void
      onSuccess?: () => void
      onError?: (err: { message: string }) => void
    }) => ({
      mutate: (data: unknown) => {
        mockMutate(data)
        options.onSuccess?.()
      },
      isPending: false,
    }),
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries,
    }),
  }
})

describe("TagManagement", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Rendering", () => {
    it("renders Tags header", () => {
      render(<TagManagement />)
      expect(screen.getByText("Tags")).toBeInTheDocument()
    })

    it("renders Add Tag button", () => {
      render(<TagManagement />)
      expect(
        screen.getByRole("button", { name: /add tag/i }),
      ).toBeInTheDocument()
    })

    it("does not show add tag form by default", () => {
      render(<TagManagement />)
      expect(screen.queryByPlaceholderText("Tag name")).not.toBeInTheDocument()
    })

    it("renders list of tags", () => {
      render(<TagManagement />)
      expect(screen.getByText("Technology")).toBeInTheDocument()
      expect(screen.getByText("Science")).toBeInTheDocument()
    })

    it("renders tag descriptions when provided", () => {
      render(<TagManagement />)
      expect(screen.getByText("Tech related feeds")).toBeInTheDocument()
    })

    it("does not render description when not provided", () => {
      render(<TagManagement />)
      const scienceCard = screen
        .getByText("Science")
        .closest('[data-slot="card"]')
      expect(scienceCard).toBeInTheDocument()
      expect(scienceCard).not.toHaveTextContent("null")
    })
  })

  describe("Add Tag Form", () => {
    it("shows add tag form when Add Tag button clicked", async () => {
      const user = userEvent.setup()
      render(<TagManagement />)

      await user.click(screen.getByRole("button", { name: /add tag/i }))

      expect(screen.getByPlaceholderText("Tag name")).toBeInTheDocument()
      expect(
        screen.getByPlaceholderText("Description (optional)"),
      ).toBeInTheDocument()
    })

    it("hides add tag form when Add Tag button clicked again", async () => {
      const user = userEvent.setup()
      render(<TagManagement />)

      const addButton = screen.getByRole("button", { name: /add tag/i })
      await user.click(addButton)
      await user.click(addButton)

      expect(screen.queryByPlaceholderText("Tag name")).not.toBeInTheDocument()
    })

    it("renders Create and Cancel buttons in add form", async () => {
      const user = userEvent.setup()
      render(<TagManagement />)

      await user.click(screen.getByRole("button", { name: /add tag/i }))

      expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
    })

    it("updates tag name input value on change", async () => {
      const user = userEvent.setup()
      render(<TagManagement />)

      await user.click(screen.getByRole("button", { name: /add tag/i }))
      const input = screen.getByPlaceholderText("Tag name")
      await user.type(input, "New Tag")

      expect(input).toHaveValue("New Tag")
    })

    it("updates description input value on change", async () => {
      const user = userEvent.setup()
      render(<TagManagement />)

      await user.click(screen.getByRole("button", { name: /add tag/i }))
      const input = screen.getByPlaceholderText("Description (optional)")
      await user.type(input, "Tag description")

      expect(input).toHaveValue("Tag description")
    })

    it("clears inputs and hides form when Cancel clicked", async () => {
      const user = userEvent.setup()
      render(<TagManagement />)

      await user.click(screen.getByRole("button", { name: /add tag/i }))
      await user.type(screen.getByPlaceholderText("Tag name"), "Test")
      await user.type(
        screen.getByPlaceholderText("Description (optional)"),
        "Desc",
      )
      await user.click(screen.getByRole("button", { name: "Cancel" }))

      expect(screen.queryByPlaceholderText("Tag name")).not.toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: /add tag/i }))
      expect(screen.getByPlaceholderText("Tag name")).toHaveValue("")
      expect(screen.getByPlaceholderText("Description (optional)")).toHaveValue(
        "",
      )
    })

    it("shows error toast when creating tag with empty name", async () => {
      const user = userEvent.setup()
      render(<TagManagement />)

      await user.click(screen.getByRole("button", { name: /add tag/i }))
      await user.click(screen.getByRole("button", { name: "Create" }))

      expect(mockToast.error).toHaveBeenCalledWith("Please enter a tag name")
    })

    it("shows error toast when creating tag with whitespace only name", async () => {
      const user = userEvent.setup()
      render(<TagManagement />)

      await user.click(screen.getByRole("button", { name: /add tag/i }))
      await user.type(screen.getByPlaceholderText("Tag name"), "   ")
      await user.click(screen.getByRole("button", { name: "Create" }))

      expect(mockToast.error).toHaveBeenCalledWith("Please enter a tag name")
    })
  })

  describe("Tag Actions", () => {
    it("renders edit button for each tag", () => {
      render(<TagManagement />)
      const editButtons = screen.getAllByRole("button", { name: /edit tag/i })
      expect(editButtons).toHaveLength(2)
    })

    it("renders delete button for each tag", () => {
      render(<TagManagement />)
      const deleteButtons = screen.getAllByRole("button", {
        name: /delete tag/i,
      })
      expect(deleteButtons).toHaveLength(2)
    })

    it("shows edit form when edit button clicked", async () => {
      const user = userEvent.setup()
      render(<TagManagement />)

      const editButtons = screen.getAllByRole("button", { name: /edit tag/i })
      await user.click(editButtons[0])

      const nameInputs = screen.getAllByPlaceholderText("Tag name")
      expect(nameInputs[0]).toHaveValue("Technology")
    })

    it("shows Save and Cancel buttons in edit mode", async () => {
      const user = userEvent.setup()
      render(<TagManagement />)

      const editButtons = screen.getAllByRole("button", { name: /edit tag/i })
      await user.click(editButtons[0])

      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
    })

    it("pre-fills edit form with tag data", async () => {
      const user = userEvent.setup()
      render(<TagManagement />)

      const editButtons = screen.getAllByRole("button", { name: /edit tag/i })
      await user.click(editButtons[0])

      expect(screen.getAllByPlaceholderText("Tag name")[0]).toHaveValue(
        "Technology",
      )
      expect(
        screen.getAllByPlaceholderText("Description (optional)")[0],
      ).toHaveValue("Tech related feeds")
    })

    it("cancels edit mode when Cancel button clicked", async () => {
      const user = userEvent.setup()
      render(<TagManagement />)

      const editButtons = screen.getAllByRole("button", { name: /edit tag/i })
      await user.click(editButtons[0])
      await user.click(screen.getByRole("button", { name: "Cancel" }))

      expect(
        screen.queryByRole("button", { name: "Save" }),
      ).not.toBeInTheDocument()
      expect(screen.getByText("Technology")).toBeInTheDocument()
    })

    it("shows delete confirmation dialog when delete clicked", async () => {
      const user = userEvent.setup()
      render(<TagManagement />)

      const deleteButtons = screen.getAllByRole("button", {
        name: /delete tag/i,
      })
      await user.click(deleteButtons[0])

      expect(screen.getByText("Delete Tag")).toBeInTheDocument()
      expect(
        screen.getByText(/Are you sure you want to delete "Technology"/),
      ).toBeInTheDocument()
    })

    it("renders Delete and Cancel buttons in confirmation dialog", async () => {
      const user = userEvent.setup()
      render(<TagManagement />)

      const deleteButtons = screen.getAllByRole("button", {
        name: /delete tag/i,
      })
      await user.click(deleteButtons[0])

      const dialogButtons = screen.getAllByRole("button")
      const deleteButton = dialogButtons.find(
        (btn) => btn.textContent === "Delete",
      )
      const cancelButton = dialogButtons.find(
        (btn) => btn.textContent === "Cancel",
      )

      expect(deleteButton).toBeInTheDocument()
      expect(cancelButton).toBeInTheDocument()
    })

    it("closes delete dialog when Cancel clicked", async () => {
      const user = userEvent.setup()
      render(<TagManagement />)

      const deleteButtons = screen.getAllByRole("button", {
        name: /delete tag/i,
      })
      await user.click(deleteButtons[0])

      const dialogButtons = screen.getAllByRole("button")
      const cancelButton = dialogButtons.find(
        (btn) => btn.textContent === "Cancel",
      )
      await user.click(cancelButton!)

      await waitFor(() => {
        expect(screen.queryByText("Delete Tag")).not.toBeInTheDocument()
      })
    })
  })

  describe("Loading and Empty States", () => {
    it("renders loading state when tags are loading", () => {
      jest
        .spyOn(require("@tanstack/react-query"), "useQuery")
        .mockReturnValueOnce({
          data: undefined,
          isLoading: true,
        })

      render(<TagManagement />)

      expect(screen.queryByText("Technology")).not.toBeInTheDocument()
      expect(screen.queryByText("Science")).not.toBeInTheDocument()
      expect(screen.queryByText("No tags yet")).not.toBeInTheDocument()
    })

    it("renders empty state when no tags exist", () => {
      jest
        .spyOn(require("@tanstack/react-query"), "useQuery")
        .mockReturnValueOnce({
          data: [],
          isLoading: false,
        })

      render(<TagManagement />)

      expect(screen.getByText("No tags yet")).toBeInTheDocument()
      expect(
        screen.getByText("Create tags to organize your feeds"),
      ).toBeInTheDocument()
    })

    it("renders empty state when tags is null", () => {
      jest
        .spyOn(require("@tanstack/react-query"), "useQuery")
        .mockReturnValueOnce({
          data: null,
          isLoading: false,
        })

      render(<TagManagement />)

      expect(screen.getByText("No tags yet")).toBeInTheDocument()
    })

    it("renders empty state when tags is undefined", () => {
      jest
        .spyOn(require("@tanstack/react-query"), "useQuery")
        .mockReturnValueOnce({
          data: undefined,
          isLoading: false,
        })

      render(<TagManagement />)

      expect(screen.getByText("No tags yet")).toBeInTheDocument()
    })
  })

  describe("Edge Cases", () => {
    it("renders tag with very long name", () => {
      jest
        .spyOn(require("@tanstack/react-query"), "useQuery")
        .mockReturnValueOnce({
          data: [
            {
              id: "1",
              name: "This is a very long tag name that should be truncated in the UI",
              description: null,
            },
          ],
          isLoading: false,
        })

      render(<TagManagement />)

      expect(
        screen.getByText(
          "This is a very long tag name that should be truncated in the UI",
        ),
      ).toBeInTheDocument()
    })

    it("renders tag with very long description", () => {
      jest
        .spyOn(require("@tanstack/react-query"), "useQuery")
        .mockReturnValueOnce({
          data: [
            {
              id: "1",
              name: "Tag",
              description:
                "This is a very long description that should be truncated in the UI to prevent layout issues",
            },
          ],
          isLoading: false,
        })

      render(<TagManagement />)

      expect(
        screen.getByText(
          "This is a very long description that should be truncated in the UI to prevent layout issues",
        ),
      ).toBeInTheDocument()
    })

    it("renders tag with special characters in name", () => {
      jest
        .spyOn(require("@tanstack/react-query"), "useQuery")
        .mockReturnValueOnce({
          data: [{ id: "1", name: "C++ & C# Programming!", description: null }],
          isLoading: false,
        })

      render(<TagManagement />)

      expect(screen.getByText("C++ & C# Programming!")).toBeInTheDocument()
    })

    it("handles empty string description", () => {
      jest
        .spyOn(require("@tanstack/react-query"), "useQuery")
        .mockReturnValueOnce({
          data: [{ id: "1", name: "Tag", description: "" }],
          isLoading: false,
        })

      render(<TagManagement />)

      const card = screen.getByText("Tag").closest('[data-slot="card"]')
      expect(card).toBeInTheDocument()
    })

    it("renders multiple tags correctly", () => {
      jest
        .spyOn(require("@tanstack/react-query"), "useQuery")
        .mockReturnValueOnce({
          data: [
            { id: "1", name: "Tag 1", description: "Desc 1" },
            { id: "2", name: "Tag 2", description: "Desc 2" },
            { id: "3", name: "Tag 3", description: "Desc 3" },
            { id: "4", name: "Tag 4", description: "Desc 4" },
            { id: "5", name: "Tag 5", description: "Desc 5" },
          ],
          isLoading: false,
        })

      render(<TagManagement />)

      expect(screen.getByText("Tag 1")).toBeInTheDocument()
      expect(screen.getByText("Tag 2")).toBeInTheDocument()
      expect(screen.getByText("Tag 3")).toBeInTheDocument()
      expect(screen.getByText("Tag 4")).toBeInTheDocument()
      expect(screen.getByText("Tag 5")).toBeInTheDocument()
    })
  })
})
