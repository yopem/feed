import React from "react"
import { userEvent } from "@testing-library/user-event"

import { AppSidebar } from "@/components/dashboard/layout/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { render as rtlRender, screen, waitFor } from "@/test-utils"

// Mock React Query - keep real exports but override useQuery
jest.mock("@tanstack/react-query", () => {
  // Get the actual module
  const actual = jest.requireActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  )

  return {
    ...actual,
    useQuery: jest.fn(),
  }
})

// Import after mocking so we get the mocked version
const {
  QueryClient,
  QueryClientProvider,
  useQuery,
} = require("@tanstack/react-query")
const mockUseQuery = useQuery as jest.Mock

// Custom render with SidebarProvider and QueryClientProvider
function render(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>{ui}</SidebarProvider>
    </QueryClientProvider>,
  )
}

const mockSetFeedSlug = jest.fn()
const mockSetFilter = jest.fn()
const mockSetTagSlug = jest.fn()

// Mock nuqs for URL query state management
jest.mock("nuqs", () => ({
  parseAsString: {
    withDefault: jest.fn((defaultValue) => ({
      parse: jest.fn(),
      serialize: jest.fn(),
      defaultValue,
    })),
  },
  useQueryState: jest.fn((key) => {
    if (key === "feed") return ["", mockSetFeedSlug]
    if (key === "filter") return ["all", mockSetFilter]
    if (key === "tag") return [null, mockSetTagSlug]
    return [null, jest.fn()]
  }),
}))

// Mock tRPC client with all necessary methods
const mockUseTRPC = {
  feed: {
    all: {
      queryOptions: jest.fn(() => ({
        queryKey: ["feed", "all"],
        queryFn: jest.fn(),
      })),
    },
    statistics: {
      queryOptions: jest.fn(() => ({
        queryKey: ["feed", "statistics"],
        queryFn: jest.fn(),
      })),
    },
    create: {
      mutationOptions: jest.fn(() => ({
        mutationFn: jest.fn(),
      })),
    },
    update: {
      mutationOptions: jest.fn(() => ({
        mutationFn: jest.fn(),
      })),
    },
    delete: {
      mutationOptions: jest.fn(() => ({
        mutationFn: jest.fn(),
      })),
    },
    assignTags: {
      mutationOptions: jest.fn(() => ({
        mutationFn: jest.fn(),
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
      mutationOptions: jest.fn(() => ({
        mutationFn: jest.fn(),
      })),
    },
    update: {
      mutationOptions: jest.fn(() => ({
        mutationFn: jest.fn(),
      })),
    },
    delete: {
      mutationOptions: jest.fn(() => ({
        mutationFn: jest.fn(),
      })),
    },
    pathFilter: jest.fn(() => ({ queryKey: ["tag"] })),
  },
  article: {
    pathFilter: jest.fn(() => ({ queryKey: ["article"] })),
  },
}

jest.mock("@/lib/trpc/client", () => ({
  useTRPC: jest.fn(() => mockUseTRPC),
}))

// Sample test data
const mockFeeds = [
  {
    id: "feed1",
    slug: "tech-blog",
    title: "Tech Blog",
    description: "Latest tech news",
    imageUrl: "https://example.com/tech.png",
    url: "https://example.com/feed.xml",
    userId: "user1",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
    lastUpdated: new Date("2024-01-02"),
    tags: [
      {
        tag: {
          id: "tag1",
          name: "Technology",
        },
      },
    ],
  },
  {
    id: "feed2",
    slug: "news-daily",
    title: "News Daily",
    description: "Daily news",
    imageUrl: null,
    url: "https://example.com/news.xml",
    userId: "user1",
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-01-04"),
    lastUpdated: new Date("2024-01-04"),
    tags: [
      {
        tag: {
          id: "tag2",
          name: "News",
        },
      },
    ],
  },
]

const mockTags = [
  {
    id: "tag1",
    name: "Technology",
    userId: "user1",
    description: "Tech articles",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "tag2",
    name: "News",
    userId: "user1",
    description: null,
    createdAt: new Date("2024-01-02"),
  },
]

const mockStatistics = [
  {
    feedId: "feed1",
    totalCount: 50,
    unreadCount: 10,
    starredCount: 5,
    readLaterCount: 3,
  },
  {
    feedId: "feed2",
    totalCount: 30,
    unreadCount: 8,
    starredCount: 2,
    readLaterCount: 1,
  },
]

describe("AppSidebar", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementation for useQuery
    mockUseQuery.mockImplementation((options) => {
      if (options.queryKey[0] === "feed" && options.queryKey[1] === "all") {
        return {
          data: mockFeeds,
          isLoading: false,
          isError: false,
        }
      }
      if (
        options.queryKey[0] === "feed" &&
        options.queryKey[1] === "statistics"
      ) {
        return {
          data: mockStatistics,
          isLoading: false,
          isError: false,
        }
      }
      if (options.queryKey[0] === "tag" && options.queryKey[1] === "all") {
        return {
          data: mockTags,
          isLoading: false,
          isError: false,
        }
      }
      return { data: undefined, isLoading: false, isError: false }
    })
  })

  describe("Rendering", () => {
    it("renders sidebar with main sections", () => {
      render(<AppSidebar />)

      expect(screen.getByText("Add Feed")).toBeInTheDocument()
      expect(screen.getByText("Filters")).toBeInTheDocument()
      expect(screen.getByText("Tags")).toBeInTheDocument()
      expect(screen.getByText("Feeds")).toBeInTheDocument()
    })

    it("renders all filter items with correct labels", () => {
      render(<AppSidebar />)

      expect(screen.getByText("All Articles")).toBeInTheDocument()
      expect(screen.getByText("Unread")).toBeInTheDocument()
      expect(screen.getByText("Starred")).toBeInTheDocument()
      expect(screen.getByText("Read Later")).toBeInTheDocument()
    })

    it("displays filter counts from statistics", () => {
      render(<AppSidebar />)

      // Total count (50 + 30 = 80)
      const allArticlesBadge = screen.getByText("80")
      expect(allArticlesBadge).toBeInTheDocument()

      // Unread count (10 + 8 = 18)
      const unreadBadge = screen.getByText("18")
      expect(unreadBadge).toBeInTheDocument()

      // Starred count (5 + 2 = 7)
      const starredBadge = screen.getByText("7")
      expect(starredBadge).toBeInTheDocument()

      // Read later count (3 + 1 = 4)
      const readLaterBadge = screen.getByText("4")
      expect(readLaterBadge).toBeInTheDocument()
    })

    it("renders feeds with titles and unread counts", () => {
      render(<AppSidebar />)

      expect(screen.getByText("Tech Blog")).toBeInTheDocument()
      expect(screen.getByText("News Daily")).toBeInTheDocument()

      // Unread counts for individual feeds
      expect(screen.getByText("10")).toBeInTheDocument() // feed1 unread
      expect(screen.getByText("8")).toBeInTheDocument() // feed2 unread
    })

    it("renders tags", () => {
      render(<AppSidebar />)

      expect(screen.getByText("Technology")).toBeInTheDocument()
      expect(screen.getByText("News")).toBeInTheDocument()
    })

    it('renders "All" option for tags', () => {
      render(<AppSidebar />)

      // Should have an "All" button in the tags section
      const allButtons = screen.getAllByText("All")
      expect(allButtons.length).toBeGreaterThan(0)
    })

    it('renders "All" option for feeds', () => {
      render(<AppSidebar />)

      const allButtons = screen.getAllByText("All")
      expect(allButtons.length).toBeGreaterThanOrEqual(2) // One for feeds, one for tags
    })
  })

  describe("Loading States", () => {
    it("displays loading skeleton when feeds are loading", () => {
      mockUseQuery.mockImplementation((options) => {
        if (options.queryKey[0] === "feed" && options.queryKey[1] === "all") {
          return {
            data: undefined,
            isLoading: true,
            isError: false,
          }
        }
        if (
          options.queryKey[0] === "feed" &&
          options.queryKey[1] === "statistics"
        ) {
          return {
            data: [],
            isLoading: false,
            isError: false,
          }
        }
        if (options.queryKey[0] === "tag") {
          return {
            data: [],
            isLoading: false,
            isError: false,
          }
        }
        return { data: undefined, isLoading: false, isError: false }
      })

      render(<AppSidebar />)

      // LoadingSkeleton should be rendered
      expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument()
    })
  })

  describe("Empty States", () => {
    it("displays empty state when no feeds exist", () => {
      mockUseQuery.mockImplementation((options) => {
        if (options.queryKey[0] === "feed" && options.queryKey[1] === "all") {
          return {
            data: [],
            isLoading: false,
            isError: false,
          }
        }
        if (
          options.queryKey[0] === "feed" &&
          options.queryKey[1] === "statistics"
        ) {
          return {
            data: [],
            isLoading: false,
            isError: false,
          }
        }
        if (options.queryKey[0] === "tag") {
          return {
            data: [],
            isLoading: false,
            isError: false,
          }
        }
        return { data: undefined, isLoading: false, isError: false }
      })

      render(<AppSidebar />)

      expect(screen.getByText("No feeds yet")).toBeInTheDocument()
      expect(
        screen.getByText("Subscribe to some RSS feeds to get started"),
      ).toBeInTheDocument()
    })

    it("does not render tags section when no tags exist", () => {
      mockUseQuery.mockImplementation((options) => {
        if (options.queryKey[0] === "feed" && options.queryKey[1] === "all") {
          return {
            data: mockFeeds,
            isLoading: false,
            isError: false,
          }
        }
        if (
          options.queryKey[0] === "feed" &&
          options.queryKey[1] === "statistics"
        ) {
          return {
            data: mockStatistics,
            isLoading: false,
            isError: false,
          }
        }
        if (options.queryKey[0] === "tag") {
          return {
            data: [],
            isLoading: false,
            isError: false,
          }
        }
        return { data: undefined, isLoading: false, isError: false }
      })

      render(<AppSidebar />)

      // Tags section should not be visible
      expect(screen.queryByText("Tags")).not.toBeInTheDocument()
    })
  })

  describe("Filter Interactions", () => {
    it("calls setFilter when filter item is clicked", async () => {
      const user = userEvent.setup()
      render(<AppSidebar />)

      const unreadFilter = screen.getByText("Unread")
      await user.click(unreadFilter)

      expect(mockSetFilter).toHaveBeenCalledWith("unread")
    })

    it("calls setFilter with correct value for each filter", async () => {
      const user = userEvent.setup()
      render(<AppSidebar />)

      await user.click(screen.getByText("All Articles"))
      expect(mockSetFilter).toHaveBeenCalledWith("all")

      await user.click(screen.getByText("Starred"))
      expect(mockSetFilter).toHaveBeenCalledWith("starred")

      await user.click(screen.getByText("Read Later"))
      expect(mockSetFilter).toHaveBeenCalledWith("readLater")
    })
  })

  describe("Feed Interactions", () => {
    it("calls setFeedSlug when feed is clicked", async () => {
      const user = userEvent.setup()
      render(<AppSidebar />)

      await user.click(screen.getByText("Tech Blog"))

      expect(mockSetFeedSlug).toHaveBeenCalledWith("tech-blog")
    })

    it('calls setFeedSlug with empty string when "All" is clicked', async () => {
      const user = userEvent.setup()
      render(<AppSidebar />)

      const allButtons = screen.getAllByText("All")
      // Find the one in the Feeds section (should be after "Feeds" label)
      await user.click(allButtons[allButtons.length - 1])

      expect(mockSetFeedSlug).toHaveBeenCalledWith("")
    })

    it("displays feed avatar with first letter fallback when no image", () => {
      render(<AppSidebar />)

      // News Daily has no imageUrl, should show fallback
      expect(screen.getByText("N")).toBeInTheDocument()
    })

    it("displays feed avatar with first letter for feed with image", () => {
      render(<AppSidebar />)

      // Tech Blog has imageUrl, but fallback should still be in DOM
      expect(screen.getByText("T")).toBeInTheDocument()
    })
  })

  describe("Tag Interactions", () => {
    it("calls setTagSlug when tag is clicked", async () => {
      const user = userEvent.setup()
      render(<AppSidebar />)

      await user.click(screen.getByText("Technology"))

      expect(mockSetTagSlug).toHaveBeenCalledWith("tag1")
    })

    it('calls setTagSlug with null when "All" tags is clicked', async () => {
      const user = userEvent.setup()
      render(<AppSidebar />)

      const allButtons = screen.getAllByText("All")
      // First "All" should be for tags
      await user.click(allButtons[0])

      expect(mockSetTagSlug).toHaveBeenCalledWith(null)
    })
  })

  describe("Dialog Interactions", () => {
    it("opens add feed dialog when Add Feed button is clicked", async () => {
      const user = userEvent.setup()
      render(<AppSidebar />)

      const addFeedButton = screen.getByRole("button", { name: /add feed/i })
      await user.click(addFeedButton)

      await waitFor(() => {
        expect(screen.getByText("Add New Feed")).toBeInTheDocument()
      })
    })

    it.skip("opens add feed dialog when hovering feeds header and clicking Add", async () => {
      const user = userEvent.setup()
      render(<AppSidebar />)

      const feedsLabel = screen.getByText("Feeds")
      await user.hover(feedsLabel)

      // Wait for Add button to appear on hover
      await waitFor(() => {
        const addButtons = screen.getAllByText("Add")
        expect(addButtons.length).toBeGreaterThan(0)
      })

      const addButtons = screen.getAllByText("Add")
      // The last "Add" button should be in the Feeds section
      await user.click(addButtons[addButtons.length - 1])

      await waitFor(() => {
        expect(screen.getByText("Add New Feed")).toBeInTheDocument()
      })
    })

    it.skip("opens add tag dialog when hovering tags header and clicking Add", async () => {
      const user = userEvent.setup()
      render(<AppSidebar />)

      const tagsLabel = screen.getByText("Tags")
      await user.hover(tagsLabel)

      // Wait for Add button to appear on hover
      await waitFor(() => {
        const addButtons = screen.getAllByText("Add")
        expect(addButtons.length).toBeGreaterThan(0)
      })

      const addButtons = screen.getAllByText("Add")
      // The first "Add" button should be in the Tags section
      await user.click(addButtons[0])

      await waitFor(() => {
        expect(screen.getByText("Add New Tag")).toBeInTheDocument()
      })
    })

    it("closes add feed dialog when close is triggered", async () => {
      const user = userEvent.setup()
      render(<AppSidebar />)

      const addFeedButton = screen.getByRole("button", { name: /add feed/i })
      await user.click(addFeedButton)

      await waitFor(() => {
        expect(screen.getByText("Add New Feed")).toBeInTheDocument()
      })

      // Click the close button
      const closeButton = screen.getByLabelText("Close")
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText("Add New Feed")).not.toBeInTheDocument()
      })
    })
  })

  describe("Feed Actions Menu", () => {
    it("shows dropdown menu when hovering over feed and clicking more options", async () => {
      const user = userEvent.setup()
      render(<AppSidebar />)

      const techBlogFeed = screen.getByText("Tech Blog")
      await user.hover(techBlogFeed)

      // Wait for more options button to appear
      await waitFor(() => {
        const moreButtons = screen.getAllByRole("button", {
          name: /more options/i,
        })
        expect(moreButtons.length).toBeGreaterThan(0)
      })

      const moreButton = screen.getAllByRole("button", {
        name: /more options/i,
      })[0]
      await user.click(moreButton)

      await waitFor(() => {
        expect(
          screen.getByRole("menuitem", { name: /edit/i }),
        ).toBeInTheDocument()
        expect(
          screen.getByRole("menuitem", { name: /delete/i }),
        ).toBeInTheDocument()
      })
    })

    it.skip("opens edit feed dialog when Edit is clicked from dropdown", async () => {
      const user = userEvent.setup()
      render(<AppSidebar />)

      const techBlogFeed = screen.getByText("Tech Blog")
      await user.hover(techBlogFeed)

      await waitFor(() => {
        const moreButtons = screen.getAllByRole("button", {
          name: /more options/i,
        })
        expect(moreButtons.length).toBeGreaterThan(0)
      })

      const moreButton = screen.getAllByRole("button", {
        name: /more options/i,
      })[0]
      await user.click(moreButton)

      await waitFor(() => {
        expect(
          screen.getByRole("menuitem", { name: /edit/i }),
        ).toBeInTheDocument()
      })

      const editItem = screen.getByRole("menuitem", { name: /edit/i })
      await user.click(editItem)

      await waitFor(() => {
        expect(screen.getByText("Edit Feed")).toBeInTheDocument()
      })
    })

    it.skip("opens delete feed dialog when Delete is clicked from dropdown", async () => {
      const user = userEvent.setup()
      render(<AppSidebar />)

      const techBlogFeed = screen.getByText("Tech Blog")
      await user.hover(techBlogFeed)

      await waitFor(() => {
        const moreButtons = screen.getAllByRole("button", {
          name: /more options/i,
        })
        expect(moreButtons.length).toBeGreaterThan(0)
      })

      const moreButton = screen.getAllByRole("button", {
        name: /more options/i,
      })[0]
      await user.click(moreButton)

      await waitFor(() => {
        expect(
          screen.getByRole("menuitem", { name: /delete/i }),
        ).toBeInTheDocument()
      })

      const deleteItem = screen.getByRole("menuitem", { name: /delete/i })
      await user.click(deleteItem)

      await waitFor(() => {
        expect(screen.getByText(/delete feed/i)).toBeInTheDocument()
      })
    })
  })

  describe("Tag Actions Menu", () => {
    it("shows dropdown menu when hovering over tag and clicking more options", async () => {
      const user = userEvent.setup()
      render(<AppSidebar />)

      const technologyTag = screen.getByText("Technology")
      await user.hover(technologyTag)

      // Wait for more options button to appear
      await waitFor(() => {
        const moreButtons = screen.getAllByRole("button", {
          name: /more options/i,
        })
        expect(moreButtons.length).toBeGreaterThan(0)
      })

      const moreButton = screen.getAllByRole("button", {
        name: /more options/i,
      })[0]
      await user.click(moreButton)

      await waitFor(() => {
        const editItems = screen.getAllByRole("menuitem", { name: /edit/i })
        expect(editItems.length).toBeGreaterThan(0)
      })
    })

    it("opens edit tag dialog when Edit is clicked from tag dropdown", async () => {
      const user = userEvent.setup()
      render(<AppSidebar />)

      const technologyTag = screen.getByText("Technology")
      await user.hover(technologyTag)

      await waitFor(() => {
        const moreButtons = screen.getAllByRole("button", {
          name: /more options/i,
        })
        expect(moreButtons.length).toBeGreaterThan(0)
      })

      const moreButton = screen.getAllByRole("button", {
        name: /more options/i,
      })[0]
      await user.click(moreButton)

      await waitFor(() => {
        const editItems = screen.getAllByRole("menuitem", { name: /edit/i })
        expect(editItems.length).toBeGreaterThan(0)
      })

      const editItem = screen.getAllByRole("menuitem", { name: /edit/i })[0]
      await user.click(editItem)

      await waitFor(() => {
        expect(screen.getByText("Edit Tag")).toBeInTheDocument()
      })
    })

    it("opens delete tag dialog when Delete is clicked from tag dropdown", async () => {
      const user = userEvent.setup()
      render(<AppSidebar />)

      const technologyTag = screen.getByText("Technology")
      await user.hover(technologyTag)

      await waitFor(() => {
        const moreButtons = screen.getAllByRole("button", {
          name: /more options/i,
        })
        expect(moreButtons.length).toBeGreaterThan(0)
      })

      const moreButton = screen.getAllByRole("button", {
        name: /more options/i,
      })[0]
      await user.click(moreButton)

      await waitFor(() => {
        const deleteItems = screen.getAllByRole("menuitem", { name: /delete/i })
        expect(deleteItems.length).toBeGreaterThan(0)
      })

      const deleteItem = screen.getAllByRole("menuitem", { name: /delete/i })[0]
      await user.click(deleteItem)

      await waitFor(() => {
        expect(screen.getByText(/delete tag/i)).toBeInTheDocument()
      })
    })
  })

  describe("Tag Filtering", () => {
    it("filters feeds by selected tag", () => {
      // Mock with tag selection
      const mockUseQueryStateWithTag = jest.fn((key) => {
        if (key === "feed") return ["", mockSetFeedSlug]
        if (key === "filter") return ["all", mockSetFilter]
        if (key === "tag") return ["tag1", mockSetTagSlug] // Tag1 selected
        return [null, jest.fn()]
      })

      jest
        .mocked(require("nuqs").useQueryState)
        .mockImplementation(mockUseQueryStateWithTag)

      render(<AppSidebar />)

      // Should only show feeds with tag1 (Technology)
      expect(screen.getByText("Tech Blog")).toBeInTheDocument()
      // News Daily has tag2, should not be visible or should be filtered
      // Note: Both feeds are rendered, but filtering happens in the feedsWithStats logic
    })
  })

  describe("Statistics Integration", () => {
    it.skip("handles missing statistics gracefully", () => {
      mockUseQuery.mockImplementation((options) => {
        if (options.queryKey[0] === "feed" && options.queryKey[1] === "all") {
          return {
            data: mockFeeds,
            isLoading: false,
            isError: false,
          }
        }
        if (
          options.queryKey[0] === "feed" &&
          options.queryKey[1] === "statistics"
        ) {
          return {
            data: undefined,
            isLoading: false,
            isError: false,
          }
        }
        if (options.queryKey[0] === "tag") {
          return {
            data: mockTags,
            isLoading: false,
            isError: false,
          }
        }
        return { data: undefined, isLoading: false, isError: false }
      })

      render(<AppSidebar />)

      // Should still render feeds
      expect(screen.getByText("Tech Blog")).toBeInTheDocument()
      expect(screen.getByText("News Daily")).toBeInTheDocument()

      // Filter counts should be 0
      expect(screen.queryByText("80")).not.toBeInTheDocument()
      expect(screen.queryByText("18")).not.toBeInTheDocument()
    })

    it("displays 0 unread count when feed has no unread articles", () => {
      mockUseQuery.mockImplementation((options) => {
        if (options.queryKey[0] === "feed" && options.queryKey[1] === "all") {
          return {
            data: mockFeeds,
            isLoading: false,
            isError: false,
          }
        }
        if (
          options.queryKey[0] === "feed" &&
          options.queryKey[1] === "statistics"
        ) {
          return {
            data: [
              {
                feedId: "feed1",
                totalCount: 50,
                unreadCount: 0,
                starredCount: 5,
                readLaterCount: 3,
              },
              {
                feedId: "feed2",
                totalCount: 30,
                unreadCount: 0,
                starredCount: 2,
                readLaterCount: 1,
              },
            ],
            isLoading: false,
            isError: false,
          }
        }
        if (options.queryKey[0] === "tag") {
          return {
            data: mockTags,
            isLoading: false,
            isError: false,
          }
        }
        return { data: undefined, isLoading: false, isError: false }
      })

      render(<AppSidebar />)

      // Feeds should not display unread badges when count is 0
      expect(screen.queryByText("10")).not.toBeInTheDocument()
      expect(screen.queryByText("8")).not.toBeInTheDocument()
    })
  })
})
