import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render as rtlRender, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ArticleCard } from "@/components/dashboard/article/article-card"
import { useTRPC } from "@/lib/trpc/client"

jest.mock("@/lib/trpc/client")
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

const mockUseTRPC = useTRPC as jest.MockedFunction<typeof useTRPC>

describe("ArticleCard", () => {
  let queryClient: QueryClient
  const mockOnSelect = jest.fn()
  const mockMutate = jest.fn()

  const defaultProps = {
    id: "article1",
    title: "Test Article Title",
    slug: "test-article",
    description:
      "<p>This is a test description with <strong>HTML</strong> tags</p>",
    feedTitle: "Test Feed",
    feedSlug: "test-feed",
    feedImageUrl: "https://example.com/feed-icon.png",
    imageUrl: "https://example.com/article-image.jpg",
    pubDate: new Date("2024-01-01T12:00:00Z"),
    isRead: false,
    isStarred: false,
    isReadLater: false,
    isSelected: false,
    onSelect: mockOnSelect,
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
        updateReadStatus: {
          mutationOptions: (opts?: any) => ({
            mutationFn: mockMutate,
            onSuccess: opts?.onSuccess,
            onError: opts?.onError,
          }),
        },
        updateStarred: {
          mutationOptions: (opts?: any) => ({
            mutationFn: mockMutate,
            onSuccess: opts?.onSuccess,
            onError: opts?.onError,
          }),
        },
        updateReadLater: {
          mutationOptions: (opts?: any) => ({
            mutationFn: mockMutate,
            onSuccess: opts?.onSuccess,
            onError: opts?.onError,
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

  const render = (props = {}) => {
    return rtlRender(
      <QueryClientProvider client={queryClient}>
        <ArticleCard {...defaultProps} {...props} />
      </QueryClientProvider>,
    )
  }

  it("renders article title", () => {
    render()
    expect(screen.getByText("Test Article Title")).toBeInTheDocument()
  })

  it("renders feed title", () => {
    render()
    expect(screen.getByText("Test Feed")).toBeInTheDocument()
  })

  it("renders description with HTML stripped", () => {
    render()
    expect(
      screen.getByText(/This is a test description with HTML tags/i),
    ).toBeInTheDocument()
  })

  it("renders feed image when provided", () => {
    render()
    const images = screen.getAllByRole("img")
    const feedImage = images.find(
      (img) => img.getAttribute("alt") === "Test Feed",
    )
    expect(feedImage).toBeInTheDocument()
    expect(feedImage).toHaveAttribute(
      "src",
      "https://example.com/feed-icon.png",
    )
  })

  it("renders article image when provided", () => {
    render()
    const images = screen.getAllByRole("img")
    const articleImage = images.find(
      (img) => img.getAttribute("alt") === "Test Article Title",
    )
    expect(articleImage).toBeInTheDocument()
    expect(articleImage).toHaveAttribute(
      "src",
      "https://example.com/article-image.jpg",
    )
  })

  it("does not render article image when not provided", () => {
    render({ imageUrl: null })
    const images = screen.queryAllByRole("img")
    const articleImage = images.find(
      (img) => img.getAttribute("alt") === "Test Article Title",
    )
    expect(articleImage).toBeUndefined()
  })

  it("renders publication date as relative time", () => {
    render()
    const dateElement = screen.getByText(/ago/)
    expect(dateElement).toBeInTheDocument()
  })

  it("calls onSelect when card is clicked", async () => {
    const user = userEvent.setup()
    render()

    const card = screen
      .getByText("Test Article Title")
      .closest('[class*="group"]')
    if (card) {
      await user.click(card)
      expect(mockOnSelect).toHaveBeenCalledWith("article1")
    }
  })

  it("applies selected styling when isSelected is true", () => {
    const { container } = render({ isSelected: true })
    const card = container.querySelector('[class*="ring-2"]')
    expect(card).toBeInTheDocument()
  })

  it("renders read later button", () => {
    render()
    const button = screen.getByTitle(/read later/i)
    expect(button).toBeInTheDocument()
  })

  it("renders star button", () => {
    render()
    const button = screen.getByTitle(/star/i)
    expect(button).toBeInTheDocument()
  })

  it("renders mark as read button", () => {
    render()
    const button = screen.getByTitle(/mark as read/i)
    expect(button).toBeInTheDocument()
  })

  it("shows starred icon when article is starred", () => {
    render({ isStarred: true })
    const starIcon = screen.getByTitle("Starred")
    expect(starIcon).toBeInTheDocument()
  })

  it("shows read later icon when article is saved for later", () => {
    render({ isReadLater: true })
    const bookmarkIcon = screen.getByTitle("Read Later")
    expect(bookmarkIcon).toBeInTheDocument()
  })

  it("applies read styling to title when article is read", () => {
    render({ isRead: true })
    const title = screen.getByText("Test Article Title")
    expect(title).toHaveClass("text-foreground/60")
  })

  it("applies unread styling to title when article is unread", () => {
    render({ isRead: false })
    const title = screen.getByText("Test Article Title")
    expect(title).toHaveClass("text-foreground")
  })

  it('shows "Save" button text for unsaved articles', () => {
    render({ isReadLater: false })
    expect(screen.getByText(/save/i)).toBeInTheDocument()
  })

  it('shows "Saved" button text for saved articles', () => {
    render({ isReadLater: true })
    expect(screen.getByText(/saved/i)).toBeInTheDocument()
  })

  it('shows "Star" button text for unstarred articles', () => {
    render({ isStarred: false })
    expect(screen.getByText(/star/i)).toBeInTheDocument()
  })

  it('shows "Starred" button text for starred articles', () => {
    render({ isStarred: true })
    expect(screen.getByText(/starred/i)).toBeInTheDocument()
  })

  it('shows "Unread" button text for unread articles', () => {
    render({ isRead: false })
    expect(screen.getByText(/unread/i)).toBeInTheDocument()
  })

  it('shows "Read" button text for read articles', () => {
    render({ isRead: true })
    expect(screen.getByText(/read/i)).toBeInTheDocument()
  })
})
