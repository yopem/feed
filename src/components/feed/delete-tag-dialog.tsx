"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/toast"
import { useTRPC } from "@/lib/trpc/client"

interface DeleteTagDialogProps {
  isOpen: boolean
  onClose: () => void
  tagId: string
  tagName: string
  onDeleteSuccess?: () => void
}

export function DeleteTagDialog({
  isOpen,
  onClose,
  tagId,
  tagName,
  onDeleteSuccess,
}: DeleteTagDialogProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const deleteTag = useMutation(
    trpc.tag.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.tag.all.queryOptions())
        await queryClient.invalidateQueries(trpc.feed.pathFilter())
        onDeleteSuccess?.()
        onClose()
        toast.success("Tag deleted successfully")
      },
      onError: (err: { message: string }) => {
        toast.error(err.message || "Failed to delete tag")
      },
    }),
  )

  const handleDelete = () => {
    deleteTag.mutate(tagId)
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Tag</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{tagName}"? This will remove the
            tag from all feeds. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteTag.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteTag.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteTag.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  )
}
