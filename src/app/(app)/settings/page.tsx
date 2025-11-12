"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeftIcon } from "lucide-react"
import { toast } from "sonner"
import type { z } from "zod"

import { LoadingSkeleton } from "@/components/shared/loading-skeleton"
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
import { updateUserSettingsSchema } from "@/lib/db/schema"
import type { SelectUserSettings } from "@/lib/db/schema/user-settings"
import { useTRPC } from "@/lib/trpc/client"

/**
 * Settings Page - User preferences for feed refresh behavior
 *
 * Follows the TanStack Form pattern:
 * - Import schema and create form schema inline with .pick()
 * - Initialize form with defaultValues from fetched settings
 * - Field-level validation with validators.onSubmit
 * - Form submission using form.Subscribe state
 */

const formSchema = updateUserSettingsSchema.pick({
  autoRefreshEnabled: true,
  refreshIntervalHours: true,
})
type FormData = z.infer<typeof formSchema>

function SettingsContent() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery(
    trpc.user.getSettings.queryOptions(),
  ) as { data: SelectUserSettings | undefined; isLoading: boolean }

  const form = useForm({
    defaultValues: {
      autoRefreshEnabled: settings?.autoRefreshEnabled ?? true,
      refreshIntervalHours: settings?.refreshIntervalHours ?? 24,
    } as FormData,
    onSubmit: async ({ value }) => {
      try {
        await updateSettings.mutateAsync({
          autoRefreshEnabled: value.autoRefreshEnabled,
          refreshIntervalHours: value.refreshIntervalHours,
        })
        // eslint-disable-next-line no-empty
      } catch {}
    },
  })

  const updateSettings = useMutation(
    trpc.user.updateSettings.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.user.pathFilter())
        toast.success("Settings saved successfully")
      },
      onError: (err: { message: string }) => {
        toast.error(err.message || "Failed to save settings")
      },
    }),
  )

  if (isLoading) {
    return <LoadingSkeleton variant="list" count={2} />
  }

  return (
    <>
      <header className="bg-background border-border sticky top-0 z-10 flex items-center gap-4 border-b-2 px-4 py-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="sr-only">Back to Home</span>
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">Settings</h1>
      </header>

      <div className="container mx-auto max-w-2xl p-6">
        <Card className="p-6">
          <h2 className="text-foreground mb-4 text-lg font-semibold">
            Auto-Refresh Settings
          </h2>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              void form.handleSubmit()
            }}
            className="space-y-6"
          >
            <form.Field
              name="autoRefreshEnabled"
              validators={{
                onSubmit: ({ value }) => {
                  const result =
                    formSchema.shape.autoRefreshEnabled.safeParse(value)
                  if (!result.success) {
                    return result.error.issues[0]?.message || "Invalid value"
                  }
                  return undefined
                },
              }}
            >
              {(field) => (
                <Field data-invalid={field.state.meta.errors.length > 0}>
                  <FieldContent>
                    <div className="flex items-center gap-3">
                      <input
                        id={field.name}
                        name={field.name}
                        type="checkbox"
                        checked={field.state.value}
                        onChange={(e) => field.handleChange(e.target.checked)}
                        disabled={updateSettings.isPending}
                        className="border-border h-4 w-4 rounded"
                      />
                      <FieldLabel htmlFor={field.name} className="mb-0">
                        Enable automatic feed refresh
                      </FieldLabel>
                    </div>
                    <FieldDescription>
                      Automatically check for new articles when you log in,
                      based on your refresh interval
                    </FieldDescription>
                    {field.state.meta.errors.length > 0 && (
                      <FieldError>{field.state.meta.errors[0]!}</FieldError>
                    )}
                  </FieldContent>
                </Field>
              )}
            </form.Field>

            <form.Field
              name="refreshIntervalHours"
              validators={{
                onSubmit: ({ value }) => {
                  const result =
                    formSchema.shape.refreshIntervalHours.safeParse(value)
                  if (!result.success) {
                    return result.error.issues[0]?.message || "Invalid interval"
                  }
                  return undefined
                },
              }}
            >
              {(field) => (
                <Field data-invalid={field.state.meta.errors.length > 0}>
                  <FieldContent>
                    <FieldLabel htmlFor={field.name}>
                      Refresh Interval (hours)
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      min={1}
                      max={168}
                      value={field.state.value ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10)
                        field.handleChange(isNaN(val) ? 0 : val)
                      }}
                      disabled={updateSettings.isPending}
                      aria-invalid={field.state.meta.errors.length > 0}
                    />
                    <FieldDescription>
                      How many hours to wait between automatic refreshes (1-168
                      hours)
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
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    onClick={() => form.reset()}
                    variant="secondary"
                    disabled={updateSettings.isPending}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isSubmitting || !canSubmit || updateSettings.isPending
                    }
                  >
                    {updateSettings.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              )}
            </form.Subscribe>
          </form>
        </Card>
      </div>
    </>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="list" count={3} />}>
      <SettingsContent />
    </Suspense>
  )
}
