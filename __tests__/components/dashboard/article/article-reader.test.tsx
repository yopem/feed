import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render as rtlRender, screen, waitFor } from "@testing-library/react"

import { ArticleReader } from "@/components/dashboard/article/article-reader"
import { useTRPC } from "@/lib/trpc/client"

jest.mock("@/lib/trpc/client")
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}))
jest.mock("@/components/dashboard/article/article-actions", () => ({
  ArticleActions: ({ articleId, isStarred, isReadLater }: any) => (
    <div data-testid="article-actions">
      <span>Actions for {articleId}</span>
      {isStarred && <span>Starred</span>}
      {isReadLater && <span>Read Later</span>}
    </div>
  ),
}))

const mockUseTRPC = useTRPC as jest.MockedFunction<typeof useTRPC>

describe("ArticleReader", () => {
  let queryClient: QueryClient
  const mockMutate = jest.fn()

  const mockArticle = {
    id: "article1",
    title: "Test Article Title",
    slug: "test-article",
    description: "This is a test description",
    content: "<p>This is the article <strong>content</strong> with HTML</p>",
    imageUrl: "https://example.com/article-image.jpg",
    link: "https://example.com/article",
    pubDate: new Date("2024-01-15T12:00:00Z"),
    isRead: false,
    isStarred: false,
    isReadLater: false,
    feed: {
      title: "Test Feed",
      slug: "test-feed",
      imageUrl: "https://example.com/feed-icon.png",
    },
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    mockUseTRPC.mockReturnValue({
      article: {
        byId: {
          queryOptions: () => ({
            queryKey: ["article", "byId"],
            queryFn: async () => mockArticle,
          }),
        },
        updateReadStatus: {
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
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const render = (articleId: string | null = "article1") => {
    return rtlRender(
      <QueryClientProvider client={queryClient}>
        <ArticleReader articleId={articleId} />
      </QueryClientProvider>,
    )
  }

  it("shows empty state when no article is selected", () => {
    render(null)
    expect(screen.getByText("No article selected")).toBeInTheDocument()
    expect(
      screen.getByText("Select an article from the list to read"),
    ).toBeInTheDocument()
  })

  it("shows loading skeleton while fetching article", () => {
    mockUseTRPC.mockReturnValue({
      article: {
        byId: {
          queryOptions: () => ({
            queryKey: ["article", "byId"],
            queryFn: async () => new Promise(() => {}), // Never resolves
          }),
        },
        updateReadStatus: {
          mutationOptions: () => ({
            mutationFn: mockMutate,
          }),
        },
        pathFilter: () => ["article"],
      },
      feed: {
        pathFilter: () => ["feed"],
      },
    } as any)

    const { container } = render()
    const skeletons = container.querySelectorAll(".animate-pulse")
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("shows empty state when article is not found", async () => {
    mockUseTRPC.mockReturnValue({
      article: {
        byId: {
          queryOptions: () => ({
            queryKey: ["article", "byId"],
            queryFn: async () => undefined,
          }),
        },
        updateReadStatus: {
          mutationOptions: () => ({
            mutationFn: mockMutate,
          }),
        },
        pathFilter: () => ["article"],
      },
      feed: {
        pathFilter: () => ["feed"],
      },
    } as any)

    render()

    await waitFor(() => {
      expect(screen.getByText("Article not found")).toBeInTheDocument()
      expect(
        screen.getByText("The article you're looking for doesn't exist"),
      ).toBeInTheDocument()
    })
  })

  it("renders article title", async () => {
    render()

    await waitFor(() => {
      expect(screen.getByText("Test Article Title")).toBeInTheDocument()
    })
  })

  it("renders feed information", async () => {
    render()

    await waitFor(() => {
      expect(screen.getByText("Test Feed")).toBeInTheDocument()
    })
  })

  it("renders feed image when provided", async () => {
    render()

    await waitFor(() => {
      const images = screen.getAllByRole("img")
      const feedImage = images.find(
        (img) => img.getAttribute("alt") === "Test Feed",
      )
      expect(feedImage).toBeInTheDocument()
    })
  })

  it("renders article image when provided", async () => {
    render()

    await waitFor(() => {
      const images = screen.getAllByRole("img")
      const articleImage = images.find(
        (img) => img.getAttribute("alt") === "Test Article Title",
      )
      expect(articleImage).toBeInTheDocument()
    })
  })

  it("does not render article image when not provided", async () => {
    mockUseTRPC.mockReturnValue({
      article: {
        byId: {
          queryOptions: () => ({
            queryKey: ["article", "byId"],
            queryFn: async () => ({ ...mockArticle, imageUrl: null }),
          }),
        },
        updateReadStatus: {
          mutationOptions: () => ({
            mutationFn: mockMutate,
          }),
        },
        pathFilter: () => ["article"],
      },
      feed: {
        pathFilter: () => ["feed"],
      },
    } as any)

    render()

    await waitFor(() => {
      const images = screen.getAllByRole("img")
      const articleImage = images.find(
        (img) => img.getAttribute("alt") === "Test Article Title",
      )
      expect(articleImage).toBeUndefined()
    })
  })

  it("renders article description", async () => {
    render()

    await waitFor(() => {
      expect(screen.getByText("This is a test description")).toBeInTheDocument()
    })
  })

  it("renders article content with sanitized HTML", async () => {
    render()

    await waitFor(() => {
      expect(screen.getByText(/This is the article/)).toBeInTheDocument()
      expect(screen.getByText(/content/)).toBeInTheDocument()
    })
  })

  it('shows "no content" message when content is null', async () => {
    mockUseTRPC.mockReturnValue({
      article: {
        byId: {
          queryOptions: () => ({
            queryKey: ["article", "byId"],
            queryFn: async () => ({ ...mockArticle, content: null }),
          }),
        },
        updateReadStatus: {
          mutationOptions: () => ({
            mutationFn: mockMutate,
          }),
        },
        pathFilter: () => ["article"],
      },
      feed: {
        pathFilter: () => ["feed"],
      },
    } as any)

    render()

    await waitFor(() => {
      expect(screen.getByText(/No content available/)).toBeInTheDocument()
      expect(screen.getByText("Open Original")).toBeInTheDocument()
    })
  })

  it('renders "Open Original" link with correct href', async () => {
    mockUseTRPC.mockReturnValue({
      article: {
        byId: {
          queryOptions: () => ({
            queryKey: ["article", "byId"],
            queryFn: async () => ({ ...mockArticle, content: null }),
          }),
        },
        updateReadStatus: {
          mutationOptions: () => ({
            mutationFn: mockMutate,
          }),
        },
        pathFilter: () => ["article"],
      },
      feed: {
        pathFilter: () => ["feed"],
      },
    } as any)

    render()

    await waitFor(() => {
      const link = screen.getByText("Open Original")
      expect(link).toHaveAttribute("href", "https://example.com/article")
      expect(link).toHaveAttribute("target", "_blank")
      expect(link).toHaveAttribute("rel", "noopener noreferrer")
    })
  })

  it("renders article actions component", async () => {
    render()

    await waitFor(() => {
      expect(screen.getByTestId("article-actions")).toBeInTheDocument()
      expect(screen.getByText("Actions for article1")).toBeInTheDocument()
    })
  })

  it("formats publication date correctly", async () => {
    render()

    await waitFor(() => {
      expect(screen.getByText("January 15, 2024")).toBeInTheDocument()
    })
  })

  it("automatically marks unread article as read", async () => {
    render()

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled()
      // Check that the first argument contains the correct data
      const callArgs = mockMutate.mock.calls[0]
      expect(callArgs[0]).toEqual({ id: "article1", isRead: true })
    })
  })

  it("does not mark already read article as read again", async () => {
    mockUseTRPC.mockReturnValue({
      article: {
        byId: {
          queryOptions: () => ({
            queryKey: ["article", "byId"],
            queryFn: async () => ({ ...mockArticle, isRead: true }),
          }),
        },
        updateReadStatus: {
          mutationOptions: () => ({
            mutationFn: mockMutate,
          }),
        },
        pathFilter: () => ["article"],
      },
      feed: {
        pathFilter: () => ["feed"],
      },
    } as any)

    render()

    await waitFor(() => {
      expect(screen.getByText("Test Article Title")).toBeInTheDocument()
    })

    // Wait a bit more to ensure mutation is not called
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it("passes correct props to ArticleActions", async () => {
    mockUseTRPC.mockReturnValue({
      article: {
        byId: {
          queryOptions: () => ({
            queryKey: ["article", "byId"],
            queryFn: async () => ({
              ...mockArticle,
              isStarred: true,
              isReadLater: true,
            }),
          }),
        },
        updateReadStatus: {
          mutationOptions: () => ({
            mutationFn: mockMutate,
          }),
        },
        pathFilter: () => ["article"],
      },
      feed: {
        pathFilter: () => ["feed"],
      },
    } as any)

    render()

    await waitFor(() => {
      const actionsComponent = screen.getByTestId("article-actions")
      expect(actionsComponent).toHaveTextContent("Starred")
      expect(actionsComponent).toHaveTextContent("Read Later")
    })
  })
})
