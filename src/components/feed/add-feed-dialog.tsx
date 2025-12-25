"use client"

import { useState } from "react"
import Image from "next/image"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  GlobeIcon,
  NewspaperIcon,
  PlusIcon,
  RssIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs"
import { toast } from "@/components/ui/toast"
import { queryApi } from "@/lib/orpc/query"

interface AddFeedDialogProps {
  isOpen: boolean
  onClose: () => void
}

const formSchema = z.object({
  url: z
    .string()
    .min(1, "Feed URL is required")
    .trim()
    .refine(
      (val) => {
        if (val.length === 0) return false
        try {
          const url = new URL(val)
          if (url.protocol !== "http:" && url.protocol !== "https:") {
            return false
          }
          if (!url.hostname || url.hostname.length === 0) {
            return false
          }
          if (!url.hostname.includes(".") && url.hostname !== "localhost") {
            return false
          }
          return true
        } catch {
          return false
        }
      },
      { message: "Please enter a valid HTTP or HTTPS URL with a valid domain" },
    ),
})
type FormData = z.infer<typeof formSchema>

const POPULAR_SUBREDDITS = [
  { name: "worldnews", icon: "🌍", description: "Global news" },
  { name: "science", icon: "🔬", description: "Science news" },
  { name: "technology", icon: "🔧", description: "Technology discussions" },
  { name: "books", icon: "📚", description: "Book discussions" },
  { name: "AskReddit", icon: "❓", description: "Q&A community" },
  { name: "todayilearned", icon: "💡", description: "Interesting facts" },
]

const POPULAR_RSS_FEEDS = [
  {
    url: "https://hnrss.org/frontpage",
    name: "Hacker News",
    favicon: "https://news.ycombinator.com/favicon.ico",
    description: "Tech news and discussions",
  },
  {
    url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    name: "NY Times World",
    favicon:
      "https://www.nytimes.com/vi-assets/static-assets/favicon-4bf96cb6a1093748bf5b3c429accb9b4.ico",
    description: "International news",
  },
  {
    url: "https://feeds.bbci.co.uk/news/rss.xml",
    name: "BBC News",
    favicon: "https://www.bbc.com/favicon.ico",
    description: "Global news coverage",
  },
  {
    url: "https://www.nasa.gov/rss/dyn/breaking_news.rss",
    name: "NASA Breaking",
    favicon: "https://www.nasa.gov/favicon.ico",
    description: "Space exploration",
  },
  {
    url: "https://www.theguardian.com/world/rss",
    name: "The Guardian",
    favicon: "https://www.theguardian.com/favicon.ico",
    description: "World news",
  },
  {
    url: "https://feeds.arstechnica.com/arstechnica/index",
    name: "Ars Technica",
    favicon: "https://arstechnica.com/favicon.ico",
    description: "Science & technology",
  },
]

const POPULAR_GOOGLE_NEWS_TOPICS = [
  {
    name: "Top Stories",
    url: "https://news.google.com/rss",
    icon: "🌍",
    description: "Breaking news worldwide",
  },
  {
    name: "World",
    url: "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en",
    icon: "🌐",
    description: "International news",
  },
  {
    name: "Technology",
    url: "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en",
    icon: "💻",
    description: "Tech news and updates",
  },
  {
    name: "Business",
    url: "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en",
    icon: "💼",
    description: "Business and finance",
  },
  {
    name: "Science",
    url: "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y1RjU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en",
    icon: "🔬",
    description: "Science discoveries",
  },
  {
    name: "Health",
    url: "https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNR3QwTlRFU0FtVnVLQUFQAQ?hl=en-US&gl=US&ceid=US:en",
    icon: "🏥",
    description: "Health news",
  },
  {
    name: "Entertainment",
    url: "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en",
    icon: "🎬",
    description: "Entertainment news",
  },
  {
    name: "Sports",
    url: "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en",
    icon: "⚽",
    description: "Sports updates",
  },
]

const POPULAR_GOOGLE_NEWS_CHANNELS = [
  {
    name: "CNN",
    url: "https://news.google.com/rss/search?q=when:24h+allinurl:cnn.com&hl=en-US&gl=US&ceid=US:en",
    icon: "📺",
    description: "Cable News Network",
  },
  {
    name: "BBC News",
    url: "https://news.google.com/rss/search?q=when:24h+allinurl:bbc.com&hl=en-US&gl=US&ceid=US:en",
    icon: "📻",
    description: "British Broadcasting Corporation",
  },
  {
    name: "The New York Times",
    url: "https://news.google.com/rss/search?q=when:24h+allinurl:nytimes.com&hl=en-US&gl=US&ceid=US:en",
    icon: "📰",
    description: "NYT News",
  },
  {
    name: "Reuters",
    url: "https://news.google.com/rss/search?q=when:24h+allinurl:reuters.com&hl=en-US&gl=US&ceid=US:en",
    icon: "📡",
    description: "International news agency",
  },
  {
    name: "The Guardian",
    url: "https://news.google.com/rss/search?q=when:24h+allinurl:theguardian.com&hl=en-US&gl=US&ceid=US:en",
    icon: "🗞️",
    description: "British daily newspaper",
  },
  {
    name: "TechCrunch",
    url: "https://news.google.com/rss/search?q=when:24h+allinurl:techcrunch.com&hl=en-US&gl=US&ceid=US:en",
    icon: "💡",
    description: "Technology news",
  },
  {
    name: "The Verge",
    url: "https://news.google.com/rss/search?q=when:24h+allinurl:theverge.com&hl=en-US&gl=US&ceid=US:en",
    icon: "🔌",
    description: "Tech and culture",
  },
  {
    name: "Wired",
    url: "https://news.google.com/rss/search?q=when:24h+allinurl:wired.com&hl=en-US&gl=US&ceid=US:en",
    icon: "⚡",
    description: "Technology magazine",
  },
]

export function AddFeedDialog({ isOpen, onClose }: AddFeedDialogProps) {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [tagSearchQuery, setTagSearchQuery] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeTab, setActiveTab] = useState("websites")
  const [redditSearch, setRedditSearch] = useState("")
  const [googleNewsSearch, setGoogleNewsSearch] = useState("")
  const queryClient = useQueryClient()

  const form = useForm({
    defaultValues: {
      url: "",
    } as FormData,
    onSubmit: async ({ value }) => {
      try {
        const trimmedUrl = value.url.trim()

        const validationResult = formSchema.safeParse({ url: trimmedUrl })

        if (!validationResult.success) {
          const errorMessage =
            validationResult.error.issues[0]?.message || "Invalid URL"
          toast.error(errorMessage)
          return
        }

        const feed = await createFeed.mutateAsync(trimmedUrl)

        if (selectedTagIds.length > 0 && feed) {
          await assignTags.mutateAsync({
            feedId: feed.id,
            tagIds: selectedTagIds,
          })
        }

        form.reset()
        setSelectedTagIds([])
        setRedditSearch("")
        onClose()
        // eslint-disable-next-line no-empty
      } catch {}
    },
  })

  const { data: tags } = useQuery(queryApi.tag.all.queryOptions())

  const filteredTags =
    tags?.filter((tag) =>
      tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()),
    ) ?? []

  const exactMatch = filteredTags.find(
    (tag) => tag.name.toLowerCase() === tagSearchQuery.toLowerCase(),
  )

  const selectedTags =
    tags?.filter((tag) => selectedTagIds.includes(tag.id)) ?? []

  const createFeed = useMutation(
    queryApi.feed.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: queryApi.article.key(),
        })
        await queryClient.invalidateQueries({
          queryKey: queryApi.feed.key(),
        })
        toast.success("Feed added successfully")
      },
      onError: (err: { message: string }) => {
        const errorMessage =
          err.message ||
          "Failed to add feed. Please check the URL and try again."
        toast.error(errorMessage)
      },
    }),
  )

  const assignTags = useMutation(
    queryApi.feed.assignTags.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: queryApi.feed.key(),
        })
      },
      onError: (err: { message: string }) => {
        toast.error(err.message || "Failed to assign tags")
      },
    }),
  )

  const createTag = useMutation(
    queryApi.tag.create.mutationOptions({
      onSuccess: async (newTag) => {
        if (newTag) {
          setSelectedTagIds((prev) => [...prev, newTag.id])
        }

        await queryClient.invalidateQueries({
          queryKey: queryApi.tag.key(),
        })

        setTagSearchQuery("")
        setShowDropdown(false)
        toast.success("Tag created and added")
      },
      onError: (err: { message: string }) => {
        toast.error(err.message || "Failed to create tag")
      },
    }),
  )

  const addTag = (tagId: string) => {
    if (!selectedTagIds.includes(tagId)) {
      setSelectedTagIds((prev) => [...prev, tagId])
    }
    setTagSearchQuery("")
    setShowDropdown(false)
  }

  const removeTag = (tagId: string) => {
    setSelectedTagIds((prev) => prev.filter((id) => id !== tagId))
  }

  const handleCreateNewTag = () => {
    if (!tagSearchQuery.trim()) {
      toast.error("Please enter a tag name")
      return
    }
    createTag.mutate({ name: tagSearchQuery.trim() })
  }

  const handleClose = () => {
    form.reset()
    setSelectedTagIds([])
    setTagSearchQuery("")
    setRedditSearch("")
    setGoogleNewsSearch("")
    setActiveTab("websites")
    onClose()
  }

  const handleRedditSubmit = async (subreddit: string) => {
    if (!subreddit.trim()) {
      toast.error("Please enter a subreddit name")
      return
    }

    const redditUrl = `https://reddit.com/r/${subreddit.trim()}`

    try {
      const feed = await createFeed.mutateAsync(redditUrl)

      if (selectedTagIds.length > 0 && feed) {
        await assignTags.mutateAsync({
          feedId: feed.id,
          tagIds: selectedTagIds,
        })
      }

      form.reset()
      setSelectedTagIds([])
      setRedditSearch("")
      onClose()
      // eslint-disable-next-line no-empty
    } catch {}
  }

  /**
   * Handles submission of a popular Google News topic
   */
  const handleGoogleNewsTopicSubmit = async (topic: {
    name: string
    url: string
  }) => {
    try {
      const feed = await createFeed.mutateAsync(topic.url)

      if (selectedTagIds.length > 0 && feed) {
        await assignTags.mutateAsync({
          feedId: feed.id,
          tagIds: selectedTagIds,
        })
      }

      form.reset()
      setSelectedTagIds([])
      onClose()
      // eslint-disable-next-line no-empty
    } catch {}
  }

  /**
   * Handles submission of a custom Google News search query
   */
  const handleGoogleNewsSearchSubmit = async (query: string) => {
    if (!query.trim()) {
      toast.error("Please enter a search query")
      return
    }

    const searchUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query.trim())}&hl=en&gl=US&ceid=US:en`

    try {
      const feed = await createFeed.mutateAsync(searchUrl)

      if (selectedTagIds.length > 0 && feed) {
        await assignTags.mutateAsync({
          feedId: feed.id,
          tagIds: selectedTagIds,
        })
      }

      form.reset()
      setSelectedTagIds([])
      setGoogleNewsSearch("")
      onClose()
      // eslint-disable-next-line no-empty
    } catch {}
  }

  const TagsSection = () => (
    <div>
      <label className="text-foreground mb-2 block text-sm font-medium">
        Tags (optional)
      </label>
      <div className="space-y-2">
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge
                key={tag.id}
                variant="default"
                className="hover:border-foreground/10 cursor-pointer transition-all duration-200 hover:shadow-md motion-reduce:transition-none"
                onClick={() => removeTag(tag.id)}
              >
                {tag.name}
                <XIcon className="ml-1 h-3 w-3" />
              </Badge>
            ))}
          </div>
        )}

        <div className="relative">
          <Input
            placeholder="Search or create tag..."
            value={tagSearchQuery}
            onChange={(e) => {
              setTagSearchQuery(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => {
              setTimeout(() => setShowDropdown(false), 200)
            }}
            disabled={createTag.isPending}
          />

          {showDropdown && tagSearchQuery && (
            <div className="bg-popover text-popover-foreground border-border absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border-2 shadow-[2px_2px_0_0_hsl(var(--foreground))]">
              {filteredTags.length > 0 ? (
                <>
                  {filteredTags
                    .filter((tag) => !selectedTagIds.includes(tag.id))
                    .map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        className="hover:bg-accent block w-full px-3 py-2 text-left text-sm transition-colors"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          addTag(tag.id)
                        }}
                      >
                        {tag.name}
                      </button>
                    ))}
                  {!exactMatch && (
                    <button
                      type="button"
                      className="hover:bg-accent border-border block w-full border-t px-3 py-2 text-left text-sm transition-colors"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleCreateNewTag()
                      }}
                      disabled={createTag.isPending}
                    >
                      <PlusIcon className="mr-1 inline h-3 w-3" />
                      Create "{tagSearchQuery}"
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  className="hover:bg-accent block w-full px-3 py-2 text-left text-sm transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleCreateNewTag()
                  }}
                  disabled={createTag.isPending}
                >
                  <PlusIcon className="mr-1 inline h-3 w-3" />
                  Create "{tagSearchQuery}"
                </button>
              )}
            </div>
          )}
        </div>

        <p className="text-muted-foreground text-xs">
          Type to search existing tags or create a new one
        </p>
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogPopup className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add New Feed</DialogTitle>
        </DialogHeader>

        <DialogPanel>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTab value="websites" className="gap-2">
                <RssIcon className="h-4 w-4" />
                Websites
              </TabsTab>
              <TabsTab value="reddit" className="gap-2">
                <GlobeIcon className="h-4 w-4" />
                Reddit
              </TabsTab>
              <TabsTab value="google-news" className="gap-2">
                <NewspaperIcon className="h-4 w-4" />
                Google News
              </TabsTab>
            </TabsList>

            <TabsPanel value="websites" className="mt-4 space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  void form.handleSubmit()
                }}
                className="space-y-4"
              >
                <form.Field
                  name="url"
                  validators={{
                    onChange: ({ value }) => {
                      const result = formSchema.shape.url.safeParse(value)
                      if (!result.success) {
                        return result.error.issues[0]?.message || "Invalid URL"
                      }
                      return undefined
                    },
                    onSubmit: ({ value }) => {
                      const result = formSchema.shape.url.safeParse(value)
                      if (!result.success) {
                        return result.error.issues[0]?.message || "Invalid URL"
                      }
                      return undefined
                    },
                  }}
                >
                  {(field) => (
                    <Field data-invalid={field.state.meta.errors.length > 0}>
                      <FieldContent className="w-full">
                        <FieldLabel htmlFor={field.name}>
                          RSS/Atom Feed URL
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="text"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="https://example.com/feed.xml"
                          disabled={createFeed.isPending}
                          aria-invalid={field.state.meta.errors.length > 0}
                        />
                        <FieldDescription>
                          Enter the URL of an RSS or Atom feed. Common paths:
                          /feed, /rss, /atom.xml
                        </FieldDescription>
                        {field.state.meta.errors.length > 0 && (
                          <FieldError>{field.state.meta.errors[0]!}</FieldError>
                        )}
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>

                <div>
                  <label className="text-foreground mb-2 block text-sm font-medium">
                    Popular RSS Feeds
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {POPULAR_RSS_FEEDS.map((feed) => (
                      <button
                        key={feed.url}
                        type="button"
                        onClick={async () => {
                          try {
                            const newFeed = await createFeed.mutateAsync(
                              feed.url,
                            )

                            if (selectedTagIds.length > 0 && newFeed) {
                              await assignTags.mutateAsync({
                                feedId: newFeed.id,
                                tagIds: selectedTagIds,
                              })
                            }

                            form.reset()
                            setSelectedTagIds([])
                            onClose()
                            // eslint-disable-next-line no-empty
                          } catch {}
                        }}
                        disabled={createFeed.isPending}
                        className="bg-card hover:bg-accent border-border group hover:border-foreground/10 flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-all hover:shadow-md disabled:pointer-events-none disabled:opacity-50"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                          <Image
                            src={feed.favicon}
                            alt={feed.name}
                            width={16}
                            height={16}
                            className="h-4 w-4"
                            unoptimized
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-foreground text-sm font-medium">
                            {feed.name}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {feed.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <TagsSection />

                <form.Subscribe
                  selector={(state) => [state.isSubmitting, state.canSubmit]}
                >
                  {([isSubmitting, canSubmit]) => (
                    <DialogFooter variant="bare">
                      <Button
                        type="button"
                        onClick={handleClose}
                        variant="secondary"
                        disabled={
                          createFeed.isPending ||
                          assignTags.isPending ||
                          createTag.isPending
                        }
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          isSubmitting ||
                          !canSubmit ||
                          createFeed.isPending ||
                          assignTags.isPending ||
                          createTag.isPending
                        }
                      >
                        {createFeed.isPending || assignTags.isPending
                          ? "Adding..."
                          : createTag.isPending
                            ? "Creating tag..."
                            : "Add Feed"}
                      </Button>
                    </DialogFooter>
                  )}
                </form.Subscribe>
              </form>
            </TabsPanel>

            <TabsPanel value="reddit" className="mt-4 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-foreground mb-2 block text-sm font-medium">
                    What Reddit searches or communities do you want to follow?
                  </label>
                  <div className="relative">
                    <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      placeholder="Search term, r/subreddit, or Reddit URL"
                      value={redditSearch}
                      onChange={(e) => setRedditSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          const input = redditSearch.trim()
                          if (input) {
                            // Extract subreddit name from various formats
                            const pattern = /(?:r\/)?([a-zA-Z0-9_]+)/
                            const match = pattern.exec(input)
                            if (match?.[1]) {
                              void handleRedditSubmit(match[1])
                            }
                          }
                        }
                      }}
                      className="pl-10"
                      disabled={createFeed.isPending}
                    />
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs">
                    Enter a subreddit name (e.g., "programming", "r/technology",
                    or full URL)
                  </p>
                </div>

                <div>
                  <label className="text-foreground mb-2 block text-sm font-medium">
                    Examples
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {POPULAR_SUBREDDITS.map((subreddit) => (
                      <button
                        key={subreddit.name}
                        type="button"
                        onClick={() => void handleRedditSubmit(subreddit.name)}
                        disabled={createFeed.isPending}
                        className="bg-card hover:bg-accent border-border group hover:border-foreground/10 flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-all hover:shadow-md disabled:pointer-events-none disabled:opacity-50"
                      >
                        <span className="text-2xl">{subreddit.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-foreground text-sm font-medium">
                            r/{subreddit.name}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {subreddit.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <TagsSection />

                <DialogFooter>
                  <Button
                    type="button"
                    onClick={handleClose}
                    variant="secondary"
                    disabled={
                      createFeed.isPending ||
                      assignTags.isPending ||
                      createTag.isPending
                    }
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      const input = redditSearch.trim()
                      if (input) {
                        const pattern = /(?:r\/)?([a-zA-Z0-9_]+)/
                        const match = pattern.exec(input)
                        if (match?.[1]) {
                          void handleRedditSubmit(match[1])
                        }
                      } else {
                        toast.error("Please enter a subreddit name")
                      }
                    }}
                    disabled={
                      !redditSearch.trim() ||
                      createFeed.isPending ||
                      assignTags.isPending ||
                      createTag.isPending
                    }
                  >
                    {createFeed.isPending || assignTags.isPending
                      ? "Adding..."
                      : "Add Subreddit"}
                  </Button>
                </DialogFooter>
              </div>
            </TabsPanel>

            {/* Google News Tab */}
            <TabsPanel value="google-news">
              <div className="space-y-4">
                <div>
                  <label className="text-foreground mb-2 block text-sm font-medium">
                    Popular Topics
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {POPULAR_GOOGLE_NEWS_TOPICS.map((topic) => (
                      <button
                        key={topic.url}
                        type="button"
                        onClick={() => handleGoogleNewsTopicSubmit(topic)}
                        disabled={
                          createFeed.isPending ||
                          assignTags.isPending ||
                          createTag.isPending
                        }
                        className="bg-card hover:bg-accent border-border group hover:border-foreground/10 flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-all hover:shadow-md disabled:pointer-events-none disabled:opacity-50"
                      >
                        <span className="text-2xl">{topic.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-foreground text-sm font-medium">
                            {topic.name}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {topic.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <label className="text-foreground mb-2 block text-sm font-medium">
                    Popular Publishers
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {POPULAR_GOOGLE_NEWS_CHANNELS.map((channel) => (
                      <button
                        key={channel.url}
                        type="button"
                        onClick={() => handleGoogleNewsTopicSubmit(channel)}
                        disabled={
                          createFeed.isPending ||
                          assignTags.isPending ||
                          createTag.isPending
                        }
                        className="bg-card hover:bg-accent border-border group hover:border-foreground/10 flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-all hover:shadow-md disabled:pointer-events-none disabled:opacity-50"
                      >
                        <span className="text-2xl">{channel.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-foreground text-sm font-medium">
                            {channel.name}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {channel.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="mb-3 text-sm font-medium">
                    Search Google News
                  </h3>
                  <Input
                    placeholder="e.g., artificial intelligence, climate change..."
                    value={googleNewsSearch}
                    onChange={(e) => setGoogleNewsSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        const query = googleNewsSearch.trim()
                        if (query) {
                          void handleGoogleNewsSearchSubmit(query)
                        } else {
                          toast.error("Please enter a search query")
                        }
                      }
                    }}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      const query = googleNewsSearch.trim()
                      if (query) {
                        void handleGoogleNewsSearchSubmit(query)
                      } else {
                        toast.error("Please enter a search query")
                      }
                    }}
                    disabled={
                      !googleNewsSearch.trim() ||
                      createFeed.isPending ||
                      assignTags.isPending ||
                      createTag.isPending
                    }
                  >
                    {createFeed.isPending || assignTags.isPending
                      ? "Adding..."
                      : "Add Feed"}
                  </Button>
                </DialogFooter>
              </div>
            </TabsPanel>
          </Tabs>
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  )
}
