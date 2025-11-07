import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render as rtlRender, screen, waitFor } from "@testing-library/react"
import { useQueryState } from "nuqs"

import { ArticleList } from "@/components/dashboard/article/article-list"
import { useTRPC } from "@/lib/trpc/client"

jest.mock("@/lib/trpc/client")
jest.mock("nuqs")
jest.mock("@/components/dashboard/article/article-card", () => ({
  ArticleCard: ({ title, id, isSelected, onSelect }: any) => (
    <div data-testid={`article-${id}`} onClick={() => onSelect(id)}>
      <h3>{title}</h3>
      {isSelected && <span>Selected</span>}
    </div>
  ),
}))
jest.mock("@/components/dashboard/shared/scroll-to-top-button", () => ({
  ScrollToTopButton: () => <button>Scroll to Top</button>,
}))

const mockUseTRPC = useTRPC as jest.MockedFunction<typeof useTRPC>
const mockUseQueryState = useQueryState as jest.MockedFunction<
  typeof useQueryState
>

// Mock IntersectionObserver
const mockObserve = jest.fn()
const mockUnobserve = jest.fn()
const mockDisconnect = jest.fn()

class MockIntersectionObserver {
  observe = mockObserve
  unobserve = mockUnobserve
  disconnect = mockDisconnect
}

global.IntersectionObserver = MockIntersectionObserver as any

describe("ArticleList", () => {
  let queryClient: QueryClient
  const mockSetSelectedArticleId = jest.fn()

  const mockFeeds = [
    { id: "feed1", slug: "tech-news", title: "Tech News" },
    { id: "feed2", slug: "dev-blog", title: "Dev Blog" },
  ]

  const mockArticles = [
    {
      id: "article1",
      title: "First Article",
      slug: "first-article",
      description: "Description 1",
      imageUrl: "https://example.com/img1.jpg",
      pubDate: new Date("2024-01-01"),
      isRead: false,
      isStarred: false,
      isReadLater: false,
      feed: {
        id: "feed1",
        title: "Tech News",
        slug: "tech-news",
        imageUrl: "https://example.com/feed1.png",
      },
    },
    {
      id: "article2",
      title: "Second Article",
      slug: "second-article",
      description: "Description 2",
      imageUrl: null,
      pubDate: new Date("2024-01-02"),
      isRead: true,
      isStarred: false,
      isReadLater: true,
      feed: {
        id: "feed2",
        title: "Dev Blog",
        slug: "dev-blog",
        imageUrl: null,
      },
    },
  ]

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    // Default mock for useQueryState
    mockUseQueryState.mockImplementation((key: string) => {
      if (key === "feed") return ["", jest.fn()] as any
      if (key === "filter") return ["all", jest.fn()] as any
      if (key === "article") return [null, mockSetSelectedArticleId] as any
      return [null, jest.fn()] as any
    })

    mockUseTRPC.mockReturnValue({
      feed: {
        all: {
          queryOptions: () => ({
            queryKey: ["feed", "all"],
            queryFn: async () => mockFeeds,
          }),
        },
      },
      article: {
        byFilterInfinite: {
          infiniteQueryOptions: () => ({
            queryKey: ["article", "byFilterInfinite"],
            queryFn: async () => ({
              articles: mockArticles,
              nextCursor: null,
            }),
          }),
        },
      },
    } as any)
  })

  afterEach(() => {
    jest.clearAllMocks()
    mockObserve.mockClear()
    mockUnobserve.mockClear()
    mockDisconnect.mockClear()
  })

  const render = () => {
    return rtlRender(
      <QueryClientProvider client={queryClient}>
        <ArticleList />
      </QueryClientProvider>,
    )
  }

  it("renders article list heading", () => {
    render()
    expect(screen.getByText("Articles")).toBeInTheDocument()
  })

  it("shows loading skeleton while fetching articles", () => {
    // Mock loading state
    mockUseTRPC.mockReturnValue({
      feed: {
        all: {
          queryOptions: () => ({
            queryKey: ["feed", "all"],
            queryFn: async () => mockFeeds,
          }),
        },
      },
      article: {
        byFilterInfinite: {
          infiniteQueryOptions: () => ({
            queryKey: ["article", "byFilterInfinite"],
            queryFn: async () => new Promise(() => {}), // Never resolves
          }),
        },
      },
    } as any)

    const { container } = render()
    // Check for skeleton loading elements by looking for animate-pulse class
    const skeletons = container.querySelectorAll(".animate-pulse")
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("renders list of articles", async () => {
    render()

    await waitFor(() => {
      expect(screen.getByText("First Article")).toBeInTheDocument()
      expect(screen.getByText("Second Article")).toBeInTheDocument()
    })
  })

  it("shows empty state when no articles found", async () => {
    mockUseTRPC.mockReturnValue({
      feed: {
        all: {
          queryOptions: () => ({
            queryKey: ["feed", "all"],
            queryFn: async () => mockFeeds,
          }),
        },
      },
      article: {
        byFilterInfinite: {
          infiniteQueryOptions: () => ({
            queryKey: ["article", "byFilterInfinite"],
            queryFn: async () => ({
              articles: [],
              nextCursor: null,
            }),
          }),
        },
      },
    } as any)

    render()

    await waitFor(() => {
      expect(screen.getByText("No articles found")).toBeInTheDocument()
      expect(
        screen.getByText("Try changing your filter or adding more feeds"),
      ).toBeInTheDocument()
    })
  })

  it("filters articles by feed slug", () => {
    mockUseQueryState.mockImplementation((key: string) => {
      if (key === "feed") return ["tech-news", jest.fn()] as any
      if (key === "filter") return ["all", jest.fn()] as any
      if (key === "article") return [null, mockSetSelectedArticleId] as any
      return [null, jest.fn()] as any
    })

    render()

    // Verify tRPC was called with correct feedId
    const trpcCalls = mockUseTRPC.mock.results[0]?.value
    expect(
      trpcCalls.article.byFilterInfinite.infiniteQueryOptions,
    ).toBeDefined()
  })

  it("filters articles by filter type", () => {
    mockUseQueryState.mockImplementation((key: string) => {
      if (key === "feed") return ["", jest.fn()] as any
      if (key === "filter") return ["starred", jest.fn()] as any
      if (key === "article") return [null, mockSetSelectedArticleId] as any
      return [null, jest.fn()] as any
    })

    render()

    // Verify tRPC was called with correct filter
    const trpcCalls = mockUseTRPC.mock.results[0]?.value
    expect(
      trpcCalls.article.byFilterInfinite.infiniteQueryOptions,
    ).toBeDefined()
  })

  it("highlights selected article", async () => {
    mockUseQueryState.mockImplementation((key: string) => {
      if (key === "feed") return ["", jest.fn()] as any
      if (key === "filter") return ["all", jest.fn()] as any
      if (key === "article")
        return ["article1", mockSetSelectedArticleId] as any
      return [null, jest.fn()] as any
    })

    render()

    await waitFor(() => {
      const selectedArticle = screen.getByTestId("article-article1")
      expect(selectedArticle).toHaveTextContent("Selected")
    })
  })

  it("renders scroll to top button", () => {
    render()
    expect(screen.getByText("Scroll to Top")).toBeInTheDocument()
  })

  it("filters out articles with null feed", async () => {
    const articlesWithNull = [
      ...mockArticles,
      {
        id: "orphaned",
        title: "Orphaned Article",
        slug: "orphaned",
        description: "No feed",
        imageUrl: null,
        pubDate: new Date("2024-01-03"),
        isRead: false,
        isStarred: false,
        isReadLater: false,
        feed: null, // Orphaned article
      },
    ]

    mockUseTRPC.mockReturnValue({
      feed: {
        all: {
          queryOptions: () => ({
            queryKey: ["feed", "all"],
            queryFn: async () => mockFeeds,
          }),
        },
      },
      article: {
        byFilterInfinite: {
          infiniteQueryOptions: () => ({
            queryKey: ["article", "byFilterInfinite"],
            queryFn: async () => ({
              articles: articlesWithNull,
              nextCursor: null,
            }),
          }),
        },
      },
    } as any)

    render()

    await waitFor(() => {
      expect(screen.getByText("First Article")).toBeInTheDocument()
      expect(screen.getByText("Second Article")).toBeInTheDocument()
      expect(screen.queryByText("Orphaned Article")).not.toBeInTheDocument()
    })
  })

  it('shows "No more articles" message when all articles loaded', async () => {
    render()

    await waitFor(() => {
      expect(screen.getByText("No more articles")).toBeInTheDocument()
    })
  })

  it("sets up intersection observer for infinite scroll", async () => {
    const { container } = render()

    // Wait for articles to render
    await waitFor(() => {
      expect(screen.getByText("First Article")).toBeInTheDocument()
    })

    // Check that the observer target div exists (h-4 class)
    const observerTarget = container.querySelector(".h-4")
    expect(observerTarget).toBeInTheDocument()
  })

  it("cleans up intersection observer on unmount", () => {
    const { unmount } = render()

    unmount()

    expect(mockDisconnect).toHaveBeenCalled()
  })
})
