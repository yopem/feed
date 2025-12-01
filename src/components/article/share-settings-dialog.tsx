"use client"

import { useEffect, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  CheckIcon,
  CopyIcon,
  FacebookIcon,
  LinkedinIcon,
  MailIcon,
  QrCodeIcon,
  XIcon,
} from "lucide-react"
import { z } from "zod"

import { QRCodeDialog } from "@/components/article/qr-code-dialog"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
import { useTRPC } from "@/lib/trpc/client"

interface ShareSettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  articleId: string
  articleTitle: string
}

const formSchema = z.object({
  shareSlug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug must be less than 50 characters")
    .regex(
      /^[a-zA-Z0-9-]+$/,
      "Slug can only contain letters, numbers, and hyphens",
    )
    .optional()
    .or(z.literal("")),
  expiresAt: z.string().optional().or(z.literal("")),
  password: z
    .string()
    .min(4, "Password must be at least 4 characters")
    .optional()
    .or(z.literal("")),
})

type FormData = z.infer<typeof formSchema>

/**
 * ShareSettingsForm - Form component for managing share settings
 *
 * Extracted as a separate component to ensure form state resets properly
 * when article data changes (e.g., after disable/enable cycles)
 */
function ShareSettingsForm({
  article,
  articleId,
  updateSettings,
}: {
  article:
    | {
        shareSlug: string | null
        shareExpiresAt: Date | null
        sharePassword: string | null
        isPubliclyShared: boolean
      }
    | undefined
  articleId: string
  updateSettings: ReturnType<
    typeof useMutation<
      unknown,
      unknown,
      {
        id: string
        shareSlug?: string
        shareExpiresAt?: Date | null
        sharePassword?: string
      },
      unknown
    >
  >
}) {
  const form = useForm({
    defaultValues: {
      shareSlug: article?.shareSlug ?? "",
      expiresAt: article?.shareExpiresAt
        ? new Date(article.shareExpiresAt).toISOString().slice(0, 16)
        : "",
      password: article?.sharePassword ?? "",
    } as FormData,
    onSubmit: async ({ value }) => {
      if (!article?.isPubliclyShared) return

      try {
        const updateData: {
          id: string
          shareSlug?: string
          shareExpiresAt?: Date | null
          sharePassword?: string
        } = {
          id: articleId,
        }

        if (value.shareSlug !== undefined && value.shareSlug !== "") {
          updateData.shareSlug = value.shareSlug
        }

        if (value.expiresAt !== undefined) {
          updateData.shareExpiresAt = value.expiresAt
            ? new Date(value.expiresAt)
            : null
        }

        if (value.password !== undefined) {
          updateData.sharePassword = value.password || ""
        }

        await updateSettings.mutateAsync(updateData)
      } catch (error: unknown) {
        const err = error as { message?: string }
        if (err.message?.includes("already in use")) {
          form.setFieldMeta("shareSlug", (prev) => ({
            ...prev,
            errors: ["This slug is already taken. Please choose another."],
          }))
        }
        throw error
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void form.handleSubmit()
      }}
      className="space-y-4"
    >
      <form.Field
        name="shareSlug"
        validators={{
          onSubmit: ({ value }) => {
            if (!value || value === "") return undefined
            const result = formSchema.shape.shareSlug.safeParse(value)
            return result.success ? undefined : result.error.issues[0]?.message
          },
        }}
      >
        {(field) => (
          <Field data-invalid={field.state.meta.errors.length > 0}>
            <FieldLabel>Slug</FieldLabel>
            <FieldContent>
              <Input
                value={field.state.value ?? ""}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="my-custom-slug"
              />
            </FieldContent>
            <FieldDescription>
              Customize the URL slug instead of using the auto-generated one
            </FieldDescription>
            {field.state.meta.errors.length > 0 && (
              <FieldError>{field.state.meta.errors[0]}</FieldError>
            )}
          </Field>
        )}
      </form.Field>

      <form.Field
        name="expiresAt"
        validators={{
          onSubmit: ({ value }) => {
            if (!value || value === "") return undefined
            const date = new Date(value)
            if (isNaN(date.getTime())) return "Invalid date"
            if (date < new Date())
              return "Expiration date must be in the future"
            return undefined
          },
        }}
      >
        {(field) => (
          <Field data-invalid={field.state.meta.errors.length > 0}>
            <FieldLabel>Expiration Date (Optional)</FieldLabel>
            <FieldContent>
              <Input
                type="datetime-local"
                value={field.state.value ?? ""}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </FieldContent>
            <FieldDescription>
              The link will automatically expire after this date
            </FieldDescription>
            {field.state.meta.errors.length > 0 && (
              <FieldError>{field.state.meta.errors[0]}</FieldError>
            )}
          </Field>
        )}
      </form.Field>

      <form.Field
        name="password"
        validators={{
          onSubmit: ({ value }) => {
            if (!value || value === "") return undefined
            if (value.length < 4)
              return "Password must be at least 4 characters"
            if (value.length > 100)
              return "Password must be less than 100 characters"
            return undefined
          },
        }}
      >
        {(field) => (
          <Field data-invalid={field.state.meta.errors.length > 0}>
            <FieldLabel>Password Protection (Optional)</FieldLabel>
            <FieldContent>
              <Input
                type="password"
                value={field.state.value ?? ""}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Enter password"
              />
            </FieldContent>
            <FieldDescription>
              Require a password to view the shared article
            </FieldDescription>
            {field.state.meta.errors.length > 0 && (
              <FieldError>{field.state.meta.errors[0]}</FieldError>
            )}
          </Field>
        )}
      </form.Field>

      <form.Subscribe
        selector={(state) => [state.isSubmitting, state.canSubmit]}
      >
        {([isSubmitting, canSubmit]) => (
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className="flex-1"
            >
              {isSubmitting ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  )
}

export function ShareSettingsDialog({
  isOpen,
  onClose,
  articleId,
  articleTitle,
}: ShareSettingsDialogProps) {
  const [copied, setCopied] = useState(false)
  const [justEnabled, setJustEnabled] = useState(false)
  const [showQrCode, setShowQrCode] = useState(false)
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: article } = useQuery({
    ...trpc.article.byId.queryOptions(articleId),
    enabled: isOpen && !!articleId,
  })

  useEffect(() => {
    if (!isOpen) {
      setJustEnabled(false)
    }
  }, [isOpen])

  const toggleShare = useMutation(
    trpc.article.togglePublicShare.mutationOptions({
      onSuccess: async (data) => {
        if (data) {
          if (data.isPubliclyShared) {
            await queryClient.refetchQueries(
              trpc.article.byId.queryOptions(articleId),
            )
            setJustEnabled(true)
            toast.success("Article is now publicly shared")
          } else {
            setJustEnabled(false)
            await queryClient.refetchQueries(
              trpc.article.byId.queryOptions(articleId),
            )
            toast.success("Sharing disabled")
            onClose()
          }
        }
      },
      onError: (error) => {
        toast.error(error.message)
      },
    }),
  )

  const updateSettings = useMutation(
    trpc.article.updateShareSettings.mutationOptions({
      onSuccess: async () => {
        await queryClient.refetchQueries(
          trpc.article.byId.queryOptions(articleId),
        )
        toast.success("Share settings updated")
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update settings")
      },
    }),
  )

  const handleEnableSharing = () => {
    toggleShare.mutate({ id: articleId, isPubliclyShared: true })
  }

  const handleDisableSharing = () => {
    toggleShare.mutate({ id: articleId, isPubliclyShared: false })
  }

  const shareUrl = article?.shareSlug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/s/${article.shareSlug}`
    : ""

  const handleCopyUrl = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success("Link copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy link")
    }
  }

  const handleSocialShare = (platform: string) => {
    if (!shareUrl) return

    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedTitle = encodeURIComponent(articleTitle)

    let url = ""

    switch (platform) {
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        break
      case "twitter":
        url = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
        break
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        break
      case "email":
        url = `mailto:?subject=${encodedTitle}&body=${encodedUrl}`
        break
      default:
        return
    }

    window.open(url, "_blank", "noopener,noreferrer,width=600,height=600")
  }

  // Show enable sharing screen if not shared
  if (!article?.isPubliclyShared && !justEnabled) {
    return (
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Share Article</AlertDialogTitle>
            <AlertDialogDescription>
              Enable public sharing to create a shareable link for "
              {articleTitle}"
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                This will generate a unique short URL that anyone can use to
                access this article, even without an account.
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              onClick={handleEnableSharing}
              disabled={toggleShare.isPending}
            >
              {toggleShare.isPending ? "Enabling..." : "Enable Sharing"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    )
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogPopup key={article?.shareSlug} className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Share Settings</AlertDialogTitle>
          <AlertDialogDescription>
            Manage public sharing settings for "{articleTitle}"
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Share Link</Label>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyUrl}
              >
                {copied ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              Anyone with this link can view the article
            </p>
          </div>

          <div className="space-y-3">
            <Label>Share on Social Media</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleSocialShare("facebook")}
                title="Share on Facebook"
              >
                <FacebookIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleSocialShare("twitter")}
                title="Share on X (Twitter)"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleSocialShare("linkedin")}
                title="Share on LinkedIn"
              >
                <LinkedinIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleSocialShare("email")}
                title="Share via Email"
              >
                <MailIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowQrCode(!showQrCode)}
                title="Show QR Code"
              >
                <QrCodeIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ShareSettingsForm
            key={article?.shareSlug ?? "new"}
            article={article}
            articleId={articleId}
            updateSettings={updateSettings}
          />
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            variant="outline"
            onClick={handleDisableSharing}
            disabled={toggleShare.isPending}
            className="text-destructive hover:text-destructive w-full"
          >
            <XIcon className="mr-2 h-4 w-4" />
            {toggleShare.isPending ? "Disabling..." : "Disable Sharing"}
          </Button>
          <AlertDialogCancel className="m-0 w-full">Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogPopup>

      <QRCodeDialog
        isOpen={showQrCode}
        onClose={() => setShowQrCode(false)}
        url={shareUrl}
        title={articleTitle}
      />
    </AlertDialog>
  )
}
