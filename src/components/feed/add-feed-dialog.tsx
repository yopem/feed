"use client"

import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PlusIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useTRPC } from "@/lib/trpc/client"

/**
 * AddFeedDialog - Form for adding new RSS/Atom feeds
 *
 * This component demonstrates the TanStack Form pattern used in this project:
 *
 * 1. Schema Definition:
 *    - Import database schema from @/lib/db/schema
 *    - Create form schema inline using .pick() or .extend()
 *    - No separate schema files needed
 *
 * 2. Form Initialization:
 *    - Use useForm() from @tanstack/react-form
 *    - Set defaultValues matching the form schema type
 *    - Define onSubmit handler with async mutation logic
 *
 * 3. Field Validation:
 *    - Use form.Field component with render prop pattern
 *    - Add validators.onSubmit for field-level validation
 *    - Validate using schema.shape.fieldName.safeParse()
 *    - Return error message string or undefined
 *
 * 4. Field Rendering:
 *    - Wrap each field in <Field data-invalid={hasErrors}>
 *    - Use FieldLabel, FieldDescription, FieldError components
 *    - Connect input to field.state.value and field.handleChange
 *    - Display field.state.meta.errors for validation feedback
 *
 * 5. Form Submission:
 *    - Use form.Subscribe to access isSubmitting/canSubmit state
 *    - Disable submit button based on form state
 *    - Call form.handleSubmit() in onSubmit handler
 *    - Handle success/error in mutation callbacks
 */

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

export function AddFeedDialog({ isOpen, onClose }: AddFeedDialogProps) {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [tagSearchQuery, setTagSearchQuery] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const trpc = useTRPC()
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
        onClose()
        // eslint-disable-next-line no-empty
      } catch {}
    },
  })

  const { data: tags } = useQuery(trpc.tag.all.queryOptions())

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
    trpc.feed.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.feed.pathFilter())
        await queryClient.invalidateQueries(trpc.article.pathFilter())
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
    trpc.feed.assignTags.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.feed.pathFilter())
      },
      onError: (err: { message: string }) => {
        toast.error(err.message || "Failed to assign tags")
      },
    }),
  )

  const createTag = useMutation(
    trpc.tag.create.mutationOptions({
      onSuccess: async (newTag) => {
        if (newTag) {
          setSelectedTagIds((prev) => [...prev, newTag.id])
        }

        await queryClient.invalidateQueries(trpc.tag.pathFilter())

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
      <Card className="w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-foreground text-xl font-bold">Add New Feed</h2>
          <Button
            onClick={() => {
              form.reset()
              setSelectedTagIds([])
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
                <FieldContent>
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
                    Enter the URL of an RSS or Atom feed. Common paths: /feed,
                    /rss, /atom.xml
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
              Tags (optional)
            </label>
            <div className="space-y-2">
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
                    setSelectedTagIds([])
                    setTagSearchQuery("")
                    onClose()
                  }}
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
              </div>
            )}
          </form.Subscribe>
        </form>
      </Card>
    </div>
  )
}
