"use client"

import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { updateTagSchema } from "@/lib/db/schema"
import { useTRPC } from "@/lib/trpc/client"

interface EditTagDialogProps {
  isOpen: boolean
  onClose: () => void
  tagId: string
  initialName: string
  initialDescription?: string
}

const formSchema = updateTagSchema.pick({ name: true, description: true })
type FormData = z.infer<typeof formSchema>

export function EditTagDialog({
  isOpen,
  onClose,
  tagId,
  initialName,
  initialDescription,
}: EditTagDialogProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const form = useForm({
    defaultValues: {
      name: initialName,
      description: initialDescription ?? "",
    } as FormData,
    onSubmit: async ({ value }) => {
      try {
        await updateTag.mutateAsync({
          id: tagId,
          name: (value.name ?? "").trim(),
          description: value.description?.trim() ?? undefined,
        })
        // eslint-disable-next-line no-empty
      } catch {}
    },
  })

  const updateTag = useMutation(
    trpc.tag.update.mutationOptions({
      onSuccess: async () => {
        toast.success("Tag updated successfully")
        await queryClient.invalidateQueries(trpc.tag.pathFilter())
        await queryClient.invalidateQueries(trpc.feed.pathFilter())
        onClose()
      },
      onError: (err: { message: string }) => {
        toast.error(err.message || "Failed to update tag")
      },
    }),
  )

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Tag</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
          className="space-y-4"
        >
          <form.Field
            name="name"
            validators={{
              onSubmit: ({ value }) => {
                const result = formSchema.shape.name.safeParse(value)
                if (!result.success) {
                  return result.error.issues[0]?.message || "Invalid name"
                }
                return undefined
              },
            }}
          >
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldContent>
                  <FieldLabel htmlFor={field.name}>Tag Name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="text"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Technology"
                    disabled={updateTag.isPending}
                    aria-invalid={field.state.meta.errors.length > 0}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <FieldError>{field.state.meta.errors[0]!}</FieldError>
                  )}
                </FieldContent>
              </Field>
            )}
          </form.Field>

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
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="A short description of this tag"
                    disabled={updateTag.isPending}
                    aria-invalid={field.state.meta.errors.length > 0}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <FieldError>{field.state.meta.errors[0]!}</FieldError>
                  )}
                </FieldContent>
              </Field>
            )}
          </form.Field>

          <form.Subscribe
            selector={(state) => [state.isSubmitting, state.canSubmit]}
          >
            {([isSubmitting, canSubmit]) => (
              <DialogFooter>
                <Button
                  type="button"
                  onClick={handleClose}
                  variant="secondary"
                  disabled={updateTag.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !canSubmit || updateTag.isPending}
                >
                  {updateTag.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
