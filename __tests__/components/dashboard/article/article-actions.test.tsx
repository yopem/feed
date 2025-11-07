import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render as rtlRender, screen, waitFor } from "@testing-library/react"
import { toast } from "sonner"

import { ArticleActions } from "@/components/dashboard/article/article-actions"
import { useTRPC } from "@/lib/trpc/client"

jest.mock("@/lib/trpc/client")
jest.mock("sonner")

const mockUseTRPC = useTRPC as jest.MockedFunction<typeof useTRPC>
const mockToast = toast as jest.Mocked<typeof toast>

describe("ArticleActions", () => {
  let queryClient: QueryClient

  const mockUser = {
    id: "user1",
    username: "testuser",
  }

  const mockMutate = jest.fn()

  const defaultProps = {
    articleId: "article1",
    isStarred: false,
    isReadLater: false,
    link: "https://example.com/article",
    feedSlug: "test-feed",
    articleSlug: "test-article",
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    mockUseTRPC.mockReturnValue({
      user: {
        getCurrentUser: {
          queryOptions: () => ({
            queryKey: ["user", "getCurrentUser"],
            queryFn: async () => mockUser,
          }),
        },
      },
      article: {
        updateStarred: {
          mutationOptions: (opts?: any) => ({
            mutationFn: mockMutate,
            onSuccess: opts?.onSuccess,
          }),
        },
        updateReadLater: {
          mutationOptions: (opts?: any) => ({
            mutationFn: mockMutate,
            onSuccess: opts?.onSuccess,
          }),
        },
        pathFilter: () => ["article"],
      },
      feed: {
        pathFilter: () => ["feed"],
      },
    } as any)

    mockToast.success = jest.fn()
    mockToast.error = jest.fn()

    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const render = (props = {}) => {
    return rtlRender(
      <QueryClientProvider client={queryClient}>
        <ArticleActions {...defaultProps} {...props} />
      </QueryClientProvider>,
    )
  }

  it("renders all action buttons", async () => {
    render()

    expect(screen.getByTitle(/add star/i)).toBeInTheDocument()
    expect(screen.getByTitle(/read later/i)).toBeInTheDocument()
    expect(screen.getByText(/open original/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTitle(/share article/i)).toBeInTheDocument()
    })
  })

  it("renders star button with unstarred state", () => {
    render({ isStarred: false })

    const starButton = screen.getByLabelText(/add star/i)
    expect(starButton).toBeInTheDocument()
  })

  it("renders star button with starred state", () => {
    render({ isStarred: true })

    const starButton = screen.getByLabelText(/remove star/i)
    expect(starButton).toBeInTheDocument()
  })

  it("renders read later button with not saved state", () => {
    render({ isReadLater: false })

    const readLaterButton = screen.getByLabelText(/read later/i)
    expect(readLaterButton).toBeInTheDocument()
  })

  it("renders read later button with saved state", () => {
    render({ isReadLater: true })

    const readLaterButton = screen.getByLabelText(/remove from read later/i)
    expect(readLaterButton).toBeInTheDocument()
  })

  it("does not render share button when feedSlug is missing", () => {
    render({ feedSlug: undefined })

    expect(screen.queryByLabelText(/share article/i)).not.toBeInTheDocument()
  })

  it("does not render share button when articleSlug is missing", () => {
    render({ articleSlug: undefined })

    expect(screen.queryByLabelText(/share article/i)).not.toBeInTheDocument()
  })

  it("renders open original link with correct href", () => {
    render()

    const link = screen.getByRole("link", { name: /open original/i })
    expect(link).toHaveAttribute("href", "https://example.com/article")
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("has correct aria-labels for accessibility", async () => {
    render()

    expect(screen.getByLabelText(/add star/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/read later/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByLabelText(/share article/i)).toBeInTheDocument()
    })
  })

  it("has correct container styling", () => {
    const { container } = render()

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass("flex", "items-center", "justify-between")
  })

  it("renders external link icon in open original button", () => {
    render()

    const link = screen.getByRole("link", { name: /open original/i })
    const svg = link.querySelector("svg")
    expect(svg).toBeInTheDocument()
  })
})
