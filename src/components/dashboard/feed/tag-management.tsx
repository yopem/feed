"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { EditIcon, PlusIcon, TagIcon, TrashIcon } from "lucide-react"
import { toast } from "sonner"

import { EmptyState } from "@/components/dashboard/shared/empty-state"
import { LoadingSkeleton } from "@/components/dashboard/shared/loading-skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useTRPC } from "@/lib/trpc/client"

export function TagManagement() {
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [newTagName, setNewTagName] = useState("")
  const [newTagDescription, setNewTagDescription] = useState("")
  const [deletingTag, setDeletingTag] = useState<{
    id: string
    name: string
  } | null>(null)

  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: tags, isLoading } = useQuery(trpc.tag.all.queryOptions())

  const createTag = useMutation(
    trpc.tag.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.tag.pathFilter())
        setNewTagName("")
        setNewTagDescription("")
        setIsAddingTag(false)
        toast.success("Tag created successfully")
      },
      onError: (err: { message: string }) => {
        toast.error(err.message || "Failed to create tag")
      },
    }),
  )

  const updateTag = useMutation(
    trpc.tag.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.tag.pathFilter())
        setEditingTagId(null)
        toast.success("Tag updated successfully")
      },
      onError: (err: { message: string }) => {
        toast.error(err.message || "Failed to update tag")
      },
    }),
  )

  const deleteTag = useMutation(
    trpc.tag.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.tag.pathFilter())
        setDeletingTag(null)
        toast.success("Tag deleted successfully")
      },
      onError: (err: { message: string }) => {
        toast.error(err.message || "Failed to delete tag")
      },
    }),
  )

  const handleCreateTag = () => {
    if (!newTagName.trim()) {
      toast.error("Please enter a tag name")
      return
    }

    createTag.mutate({
      name: newTagName.trim(),
      description: newTagDescription.trim() || undefined,
    })
  }

  const handleUpdateTag = (
    id: string,
    name: string,
    description?: string | null,
  ) => {
    if (!name.trim()) {
      toast.error("Tag name cannot be empty")
      return
    }

    updateTag.mutate({
      id,
      name: name.trim(),
      description: description?.trim() ?? undefined,
    })
  }

  return (
    <>
      <Card className="flex flex-col overflow-hidden">
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-foreground text-sm leading-5 font-medium">
              Tags
            </h2>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setIsAddingTag(!isAddingTag)}
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Add Tag
            </Button>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          {isAddingTag && (
            <Card className="space-y-3 p-3">
              <Input
                placeholder="Tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                disabled={createTag.isPending}
              />
              <Input
                placeholder="Description (optional)"
                value={newTagDescription}
                onChange={(e) => setNewTagDescription(e.target.value)}
                disabled={createTag.isPending}
              />
              <div className="flex justify-end gap-2">
                <Button
                  size="xs"
                  variant="secondary"
                  onClick={() => {
                    setIsAddingTag(false)
                    setNewTagName("")
                    setNewTagDescription("")
                  }}
                  disabled={createTag.isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="xs"
                  onClick={handleCreateTag}
                  disabled={createTag.isPending}
                >
                  {createTag.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </Card>
          )}

          {isLoading ? (
            <LoadingSkeleton variant="list" count={3} />
          ) : !tags || tags.length === 0 ? (
            <EmptyState
              title="No tags yet"
              description="Create tags to organize your feeds"
              icon={<TagIcon className="h-12 w-12" />}
            />
          ) : (
            tags.map((tag) => (
              <TagItem
                key={tag.id}
                tag={tag}
                isEditing={editingTagId === tag.id}
                onEdit={(id) => setEditingTagId(id)}
                onCancelEdit={() => setEditingTagId(null)}
                onSave={(name, description) => {
                  handleUpdateTag(tag.id, name, description)
                }}
                onDelete={(id, name) => setDeletingTag({ id, name })}
                isSaving={updateTag.isPending}
              />
            ))
          )}
        </div>
      </Card>

      {deletingTag && (
        <AlertDialog open={true} onOpenChange={() => setDeletingTag(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Tag</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deletingTag.name}"? This will
                remove the tag from all feeds. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteTag.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteTag.mutate(deletingTag.id)}
                disabled={deleteTag.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteTag.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}

interface TagItemProps {
  tag: {
    id: string
    name: string
    description?: string | null
  }
  isEditing: boolean
  onEdit: (id: string) => void
  onCancelEdit: () => void
  onSave: (name: string, description?: string | null) => void
  onDelete: (id: string, name: string) => void
  isSaving: boolean
}

function TagItem({
  tag,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  isSaving,
}: TagItemProps) {
  const [name, setName] = useState(tag.name)
  const [description, setDescription] = useState(tag.description ?? "")

  if (isEditing) {
    return (
      <Card className="space-y-3 p-3">
        <Input
          placeholder="Tag name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSaving}
        />
        <Input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSaving}
        />
        <div className="flex justify-end gap-2">
          <Button
            size="xs"
            variant="secondary"
            onClick={onCancelEdit}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            size="xs"
            onClick={() => onSave(name, description)}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="group hover:bg-accent cursor-pointer p-3 transition-all hover:scale-[1.02] hover:shadow-xl">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-foreground truncate text-sm font-semibold">
            {tag.name}
          </h4>
          {tag.description && (
            <p className="text-muted-foreground truncate text-xs">
              {tag.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            onClick={() => onEdit(tag.id)}
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Edit tag"
          >
            <EditIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            onClick={() => onDelete(tag.id, tag.name)}
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7"
            aria-label="Delete tag"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
