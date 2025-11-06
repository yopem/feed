"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PlusIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { SurfaceCard } from "@/components/dashboard/shared/surface-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTRPC } from "@/lib/trpc/client"

interface EditFeedDialogProps {
  isOpen: boolean
  onClose: () => void
  feedId: string
  initialTitle: string
  initialDescription?: string
  initialTagIds?: string[]
}

export function EditFeedDialog({
  isOpen,
  onClose,
  feedId,
  initialTitle,
  initialDescription,
  initialTagIds = [],
}: EditFeedDialogProps) {
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription ?? "")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds)
  const [tagSearchQuery, setTagSearchQuery] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  // Fetch all tags
  const { data: tags } = useQuery(trpc.tag.all.queryOptions())

  // Filter tags based on search query
  const filteredTags =
    tags?.filter((tag) =>
      tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()),
    ) ?? []

  // Check if search query matches an existing tag exactly
  const exactMatch = filteredTags.find(
    (tag) => tag.name.toLowerCase() === tagSearchQuery.toLowerCase(),
  )

  // Get selected tag objects
  const selectedTags =
    tags?.filter((tag) => selectedTagIds.includes(tag.id)) ?? []

  const updateFeed = useMutation(
    trpc.feed.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.feed.pathFilter())
        setError(null)
        onClose()
        toast.success("Feed updated successfully")
      },
      onError: (err: { message: string }) => {
        setError(err.message)
        toast.error(err.message)
      },
    }),
  )

  const assignTags = useMutation(
    trpc.feed.assignTags.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.feed.pathFilter())
      },
      onError: (err: { message: string }) => {
        toast.error(err.message || "Failed to update tags")
      },
    }),
  )

  const createTag = useMutation(
    trpc.tag.create.mutationOptions({
      onSuccess: async (newTag) => {
        await queryClient.invalidateQueries(trpc.tag.pathFilter())
        if (newTag) {
          setSelectedTagIds((prev) => [...prev, newTag.id])
        }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      const message = "Please enter a feed title"
      setError(message)
      toast.error(message)
      return
    }

    try {
      // Update feed details
      await updateFeed.mutateAsync({
        id: feedId,
        title: title.trim(),
        description: description.trim() || undefined,
      })

      // Update tag assignments
      await assignTags.mutateAsync({
        feedId,
        tagIds: selectedTagIds,
      })
    } catch {
      // Errors are already handled by mutation callbacks
    }
  }

  if (!isOpen) return null

  return (
    <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <SurfaceCard className="w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-foreground text-xl font-bold">Edit Feed</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            aria-label="Close"
          >
            <XIcon className="text-muted-foreground h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="feed-title"
              className="text-foreground mb-2 block text-sm font-medium"
            >
              Feed Title
            </label>
            <Input
              id="feed-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Favorite Blog"
              disabled={updateFeed.isPending}
            />
          </div>

          <div>
            <label
              htmlFor="feed-description"
              className="text-foreground mb-2 block text-sm font-medium"
            >
              Description (optional)
            </label>
            <Input
              id="feed-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short description of this feed"
              disabled={updateFeed.isPending}
            />
          </div>

          <div>
            <label className="text-foreground mb-2 block text-sm font-medium">
              Tags (optional)
            </label>
            <div className="space-y-2">
              {/* Selected tags */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="default"
                      className="cursor-pointer transition-colors hover:opacity-80"
                      onClick={() => removeTag(tag.id)}
                    >
                      {tag.name}
                      <XIcon className="ml-1 h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}

              {/* Search input */}
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
                    // Delay to allow clicking on dropdown items
                    setTimeout(() => setShowDropdown(false), 200)
                  }}
                  disabled={createTag.isPending}
                />

                {/* Dropdown */}
                {showDropdown && tagSearchQuery && (
                  <div className="bg-popover text-popover-foreground border-border absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border shadow-md">
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

          {error && (
            <div className="bg-destructive/20 border-destructive/50 text-destructive rounded-lg border p-3 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              disabled={updateFeed.isPending || assignTags.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateFeed.isPending || assignTags.isPending}
            >
              {updateFeed.isPending || assignTags.isPending
                ? "Saving..."
                : "Save Changes"}
            </Button>
          </div>
        </form>
      </SurfaceCard>
    </div>
  )
}
