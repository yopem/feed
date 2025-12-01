"use client"

import { Suspense } from "react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { parseAsString, useQueryState } from "nuqs"
import type { z } from "zod"

import { SettingsSidebar } from "@/components/layout/settings-sidebar"
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
import { toast } from "@/components/ui/toast"
import { updateUserSettingsSchema } from "@/lib/db/schema"
import type { SelectUserSettings } from "@/lib/db/schema/user-settings"
import { useTRPC } from "@/lib/trpc/client"

/**
 * Settings Page - User preferences organized by category
 *
 * Categories:
 * - Feed Management: Auto-refresh settings
 * - Article Management: Article retention settings
 * - Appearance: Display preferences
 *
 * Uses sidebar navigation for category switching via URL state
 */

const formSchema = updateUserSettingsSchema.pick({
  autoRefreshEnabled: true,
  refreshIntervalHours: true,
  articleRetentionDays: true,
  showFilterCountBadges: true,
})
type FormData = z.infer<typeof formSchema>

function SettingsContent() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [section] = useQueryState("section", parseAsString.withDefault("feed"))

  const { data: settings, isLoading } = useQuery(
    trpc.user.getSettings.queryOptions(),
  ) as { data: SelectUserSettings | undefined; isLoading: boolean }

  const form = useForm({
    defaultValues: {
      autoRefreshEnabled: settings?.autoRefreshEnabled ?? true,
      refreshIntervalHours: settings?.refreshIntervalHours ?? 24,
      articleRetentionDays: settings?.articleRetentionDays ?? 30,
      showFilterCountBadges: settings?.showFilterCountBadges ?? true,
    } as FormData,
    onSubmit: async ({ value }) => {
      try {
        await updateSettings.mutateAsync({
          autoRefreshEnabled: value.autoRefreshEnabled,
          refreshIntervalHours: value.refreshIntervalHours,
          articleRetentionDays: value.articleRetentionDays,
          showFilterCountBadges: value.showFilterCountBadges,
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

  const expireArticles = useMutation(
    trpc.user.expireMyArticles.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries(trpc.article.pathFilter())
        if (data?.articlesExpired === 0) {
          toast.info("No old articles to delete")
        } else {
          toast.success(
            `Deleted ${data?.articlesExpired} old article${data?.articlesExpired === 1 ? "" : "s"}`,
          )
        }
      },
      onError: (err: { message: string }) => {
        toast.error(err.message || "Failed to delete articles")
      },
    }),
  )

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <SettingsSidebar />
        <div className="flex-1 p-6">
          <LoadingSkeleton variant="list" count={2} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SettingsSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-3xl p-6 md:p-8">
          {section === "feed" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Feed Management</h1>
                <p className="text-muted-foreground mt-1">
                  Configure automatic feed refresh settings
                </p>
              </div>

              <Card className="p-6">
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
                          return (
                            result.error.issues[0]?.message || "Invalid value"
                          )
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
                              onChange={(e) =>
                                field.handleChange(e.target.checked)
                              }
                              disabled={updateSettings.isPending}
                              className="border-border h-4 w-4 rounded"
                            />
                            <FieldLabel htmlFor={field.name} className="mb-0">
                              Enable automatic feed refresh
                            </FieldLabel>
                          </div>
                          <FieldDescription>
                            Automatically check for new articles when you log
                            in, based on your refresh interval
                          </FieldDescription>
                          {field.state.meta.errors.length > 0 && (
                            <FieldError>
                              {field.state.meta.errors[0]!}
                            </FieldError>
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
                          return (
                            result.error.issues[0]?.message ||
                            "Invalid interval"
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
                            How many hours to wait between automatic refreshes
                            (1-168 hours)
                          </FieldDescription>
                          {field.state.meta.errors.length > 0 && (
                            <FieldError>
                              {field.state.meta.errors[0]!}
                            </FieldError>
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
                            isSubmitting ||
                            !canSubmit ||
                            updateSettings.isPending
                          }
                        >
                          {updateSettings.isPending
                            ? "Saving..."
                            : "Save Settings"}
                        </Button>
                      </div>
                    )}
                  </form.Subscribe>
                </form>
              </Card>
            </div>
          )}

          {section === "article" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Article Management</h1>
                <p className="text-muted-foreground mt-1">
                  Manage article retention and cleanup settings
                </p>
              </div>

              <Card className="p-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    void form.handleSubmit()
                  }}
                  className="space-y-6"
                >
                  <form.Field
                    name="articleRetentionDays"
                    validators={{
                      onSubmit: ({ value }) => {
                        const result =
                          formSchema.shape.articleRetentionDays.safeParse(value)
                        if (!result.success) {
                          return (
                            result.error.issues[0]?.message ||
                            "Invalid retention"
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
                            Article Retention Period (days)
                          </FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            type="number"
                            min={1}
                            max={365}
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
                            Automatically delete articles older than this many
                            days (1-365 days)
                          </FieldDescription>
                          <div className="mt-3">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => expireArticles.mutate()}
                              disabled={expireArticles.isPending}
                            >
                              {expireArticles.isPending
                                ? "Deleting..."
                                : "Delete Old Articles Now"}
                            </Button>
                            <p className="text-muted-foreground mt-2 text-sm">
                              Immediately delete articles older than your
                              retention setting
                            </p>
                          </div>
                          {field.state.meta.errors.length > 0 && (
                            <FieldError>
                              {field.state.meta.errors[0]!}
                            </FieldError>
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
                            isSubmitting ||
                            !canSubmit ||
                            updateSettings.isPending
                          }
                        >
                          {updateSettings.isPending
                            ? "Saving..."
                            : "Save Settings"}
                        </Button>
                      </div>
                    )}
                  </form.Subscribe>
                </form>
              </Card>
            </div>
          )}

          {section === "appearance" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Appearance</h1>
                <p className="text-muted-foreground mt-1">
                  Customize the look and feel of your feed reader
                </p>
              </div>

              <Card className="p-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    void form.handleSubmit()
                  }}
                  className="space-y-6"
                >
                  <form.Field
                    name="showFilterCountBadges"
                    validators={{
                      onSubmit: ({ value }) => {
                        const result =
                          formSchema.shape.showFilterCountBadges.safeParse(
                            value,
                          )
                        if (!result.success) {
                          return (
                            result.error.issues[0]?.message || "Invalid value"
                          )
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
                              onChange={(e) =>
                                field.handleChange(e.target.checked)
                              }
                              disabled={updateSettings.isPending}
                              className="border-border h-4 w-4 rounded"
                            />
                            <FieldLabel htmlFor={field.name} className="mb-0">
                              Show filter count badges
                            </FieldLabel>
                          </div>
                          <FieldDescription>
                            Display article counts next to filter options in the
                            sidebar
                          </FieldDescription>
                          {field.state.meta.errors.length > 0 && (
                            <FieldError>
                              {field.state.meta.errors[0]!}
                            </FieldError>
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
                            isSubmitting ||
                            !canSubmit ||
                            updateSettings.isPending
                          }
                        >
                          {updateSettings.isPending
                            ? "Saving..."
                            : "Save Settings"}
                        </Button>
                      </div>
                    )}
                  </form.Subscribe>
                </form>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen">
          <SettingsSidebar />
          <div className="flex-1 p-6">
            <LoadingSkeleton variant="list" count={3} />
          </div>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  )
}
