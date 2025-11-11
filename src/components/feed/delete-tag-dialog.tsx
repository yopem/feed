"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

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
import { useTRPC } from "@/lib/trpc/client"

interface DeleteTagDialogProps {
  isOpen: boolean
  onClose: () => void
  tagId: string
  tagName: string
}

export function DeleteTagDialog({
  isOpen,
  onClose,
  tagId,
  tagName,
}: DeleteTagDialogProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const deleteTag = useMutation(
    trpc.tag.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.tag.pathFilter())
        await queryClient.invalidateQueries(trpc.feed.pathFilter())
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
      <AlertDialogContent>
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
      </AlertDialogContent>
    </AlertDialog>
  )
}
