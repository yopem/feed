"use client"

import { useEffect, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PlusIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import type { z } from "zod"

import { SurfaceCard } from "@/components/dashboard/shared/surface-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { updateFeedSchema } from "@/lib/db/schema"
import { useTRPC } from "@/lib/trpc/client"

/**
 * EditFeedDialog - Form for editing existing feed details
 *
 * This component follows the TanStack Form pattern used throughout the project.
 * For detailed pattern documentation, see AddFeedDialog.
 *
 * Key differences from AddFeedDialog:
 * - Uses updateFeedSchema instead of insertFeedSchema
 * - Picks multiple fields (title, description)
 * - Populates defaultValues from initialProps
 * - Updates existing feed instead of creating new one
 *
 * Pattern Summary:
 * 1. Import database schema, create form schema inline with .pick()
 * 2. Initialize useForm with defaultValues and onSubmit handler
 * 3. Add field-level validation using validators.onSubmit
 * 4. Render fields using form.Field render prop pattern
 * 5. Use form.Subscribe for submit button state management
 */

interface EditFeedDialogProps {
  isOpen: boolean
  onClose: () => void
  feedId: string
  initialTitle: string
  initialDescription?: string
  initialTagIds?: string[]
}

// Create form schema inline by picking the title and description fields from updateFeedSchema
const formSchema = updateFeedSchema.pick({ title: true, description: true })
type FormData = z.infer<typeof formSchema>

export function EditFeedDialog({
  isOpen,
  onClose,
  feedId,
  initialTitle,
  initialDescription,
  initialTagIds = [],
}: EditFeedDialogProps) {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds)
  const [tagSearchQuery, setTagSearchQuery] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  // Reset form when dialog opens with new initial values
  useEffect(() => {
    if (isOpen) {
      form.reset()
      setSelectedTagIds(initialTagIds)
      setTagSearchQuery("")
      setShowDropdown(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialTagIds])

  // Initialize TanStack Form with Zod validation
  const form = useForm({
    defaultValues: {
      title: initialTitle,
      description: initialDescription ?? "",
    } as FormData,
    onSubmit: async ({ value }) => {
      try {
        // Update feed details
        await updateFeed.mutateAsync({
          id: feedId,
          title: (value.title ?? "").trim(),
          description: value.description?.trim() ?? undefined,
        })

        // Update tag assignments
        await assignTags.mutateAsync({
          feedId,
          tagIds: selectedTagIds,
        })
      } catch {
        // Errors are already handled by mutation callbacks
      }
    },
  })

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
        onClose()
        toast.success("Feed updated successfully")
      },
      onError: (err: { message: string }) => {
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

  if (!isOpen) return null

  return (
    <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <SurfaceCard className="w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-foreground text-xl font-bold">Edit Feed</h2>
          <Button
            onClick={() => {
              form.reset()
              setSelectedTagIds(initialTagIds)
              setTagSearchQuery("")
              onClose()
            }}
            variant="ghost"
            size="icon"
            aria-label="Close"
          >
            <XIcon className="text-muted-foreground h-5 w-5" />
          </Button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
          className="space-y-4"
        >
          {/* Title Field with TanStack Form */}
          <form.Field
            name="title"
            validators={{
              onSubmit: ({ value }) => {
                const result = formSchema.shape.title.safeParse(value)
                if (!result.success) {
                  return result.error.issues[0]?.message || "Invalid title"
                }
                return undefined
              },
            }}
          >
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldContent>
                  <FieldLabel htmlFor={field.name}>Feed Title</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="text"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="My Favorite Blog"
                    disabled={updateFeed.isPending}
                    aria-invalid={field.state.meta.errors.length > 0}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <FieldError>{field.state.meta.errors[0]!}</FieldError>
                  )}
                </FieldContent>
              </Field>
            )}
          </form.Field>

          {/* Description Field with TanStack Form */}
          <form.Field
            name="description"
            validators={{
              onSubmit: ({ value }) => {
                const result = formSchema.shape.description.safeParse(value)
                if (!result.success) {
                  return (
                    result.error.issues[0]?.message || "Invalid description"
                  )
                }
                return undefined
              },
            }}
          >
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldContent>
                  <FieldLabel htmlFor={field.name}>
                    Description (optional)
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="text"
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="A short description of this feed"
                    disabled={updateFeed.isPending}
                    aria-invalid={field.state.meta.errors.length > 0}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <FieldError>{field.state.meta.errors[0]!}</FieldError>
                  )}
                </FieldContent>
              </Field>
            )}
          </form.Field>

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

          <form.Subscribe
            selector={(state) => [state.isSubmitting, state.canSubmit]}
          >
            {([isSubmitting, canSubmit]) => (
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    form.reset()
                    setSelectedTagIds(initialTagIds)
                    setTagSearchQuery("")
                    onClose()
                  }}
                  variant="secondary"
                  disabled={updateFeed.isPending || assignTags.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !canSubmit ||
                    updateFeed.isPending ||
                    assignTags.isPending
                  }
                >
                  {updateFeed.isPending || assignTags.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </Button>
              </div>
            )}
          </form.Subscribe>
        </form>
      </SurfaceCard>
    </div>
  )
}
