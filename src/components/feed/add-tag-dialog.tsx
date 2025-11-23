"use client"

import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
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
import { Textarea } from "@/components/ui/textarea"
import { insertTagSchema } from "@/lib/db/schema"
import { useTRPC } from "@/lib/trpc/client"

interface AddTagDialogProps {
  isOpen: boolean
  onClose: () => void
}

const formSchema = insertTagSchema.pick({ name: true, description: true })
type FormData = z.infer<typeof formSchema>

export function AddTagDialog({ isOpen, onClose }: AddTagDialogProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
    } as FormData,
    onSubmit: async ({ value }) => {
      try {
        await createTag.mutateAsync({
          name: value.name.trim(),
          description: value.description?.trim() ?? undefined,
        })

        form.reset()
        onClose()
        // eslint-disable-next-line no-empty
      } catch {}
    },
  })

  const createTag = useMutation(
    trpc.tag.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.tag.pathFilter())
        toast.success("Tag created successfully")
      },
      onError: (err: { message: string }) => {
        toast.error(err.message || "Failed to create tag")
      },
    }),
  )

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Tag</DialogTitle>
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
                    placeholder="Enter tag name"
                    disabled={createTag.isPending}
                    aria-invalid={field.state.meta.errors.length > 0}
                  />
                  <FieldDescription>
                    A short name to identify this tag
                  </FieldDescription>
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
                if (!value) return undefined
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
                    placeholder="Enter description"
                    disabled={createTag.isPending}
                    aria-invalid={field.state.meta.errors.length > 0}
                  />
                  <FieldDescription>
                    Optional description for this tag
                  </FieldDescription>
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
                  disabled={createTag.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !canSubmit || createTag.isPending}
                >
                  {createTag.isPending ? "Creating..." : "Create Tag"}
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  )
}
