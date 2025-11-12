"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Share2Icon, ShareIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useTRPC } from "@/lib/trpc/client"

/**
 * BulkShareDialog - Manage bulk sharing for all articles in a feed
 *
 * Provides controls to enable or disable public sharing for all articles
 * in a feed at once. Optionally set an expiration date for bulk sharing.
 */
interface BulkShareDialogProps {
  isOpen: boolean
  onClose: () => void
  feedId: string
  feedTitle: string
  articleCount: number
  isBulkShared: boolean
}

export function BulkShareDialog({
  isOpen,
  onClose,
  feedId,
  feedTitle,
  articleCount,
  isBulkShared,
}: BulkShareDialogProps) {
  const [expiresAt, setExpiresAt] = useState<string>("")
  const [showConfirm, setShowConfirm] = useState(false)
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const bulkShare = useMutation(
    trpc.feed.bulkShare.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries(trpc.feed.pathFilter())
        await queryClient.invalidateQueries(trpc.article.pathFilter())
        onClose()
        toast.success(
          `Successfully enabled sharing for ${data?.enabledCount ?? articleCount} articles`,
        )
      },
      onError: (err: { message: string }) => {
        toast.error(err.message || "Failed to enable bulk sharing")
      },
    }),
  )

  const bulkUnshare = useMutation(
    trpc.feed.bulkUnshare.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries(trpc.feed.pathFilter())
        await queryClient.invalidateQueries(trpc.article.pathFilter())
        onClose()
        toast.success(
          `Successfully disabled sharing for ${data?.disabledCount ?? articleCount} articles`,
        )
      },
      onError: (err: { message: string }) => {
        toast.error(err.message || "Failed to disable bulk sharing")
      },
    }),
  )

  const handleBulkShare = () => {
    const expirationDate = expiresAt ? new Date(expiresAt) : null
    bulkShare.mutate({
      feedId,
      expiresAt: expirationDate,
    })
  }

  const handleBulkUnshare = () => {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }
    bulkUnshare.mutate(feedId)
  }

  const handleClose = () => {
    setExpiresAt("")
    setShowConfirm(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="bg-background/95 fixed inset-0 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-foreground text-xl font-bold">
            {isBulkShared ? "Manage Bulk Sharing" : "Enable Bulk Sharing"}
          </h2>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="icon"
            aria-label="Close"
          >
            <XIcon className="text-muted-foreground h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="bg-muted border-border rounded-md border-2 p-4">
            <p className="text-foreground mb-2 text-sm font-semibold">
              {feedTitle}
            </p>
            <p className="text-muted-foreground text-sm">
              {articleCount} article{articleCount !== 1 ? "s" : ""} in this feed
            </p>
          </div>

          {!isBulkShared ? (
            <>
              <div>
                <p className="text-foreground mb-2 text-sm">
                  This will enable public sharing for all {articleCount}{" "}
                  articles in this feed. Anyone with the share links will be
                  able to read them.
                </p>
              </div>

              <div>
                <label
                  htmlFor="expiresAt"
                  className="text-foreground mb-2 block text-sm font-medium"
                >
                  Expiration Date (optional)
                </label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  disabled={bulkShare.isPending}
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  Leave empty for no expiration
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  onClick={handleClose}
                  variant="secondary"
                  disabled={bulkShare.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleBulkShare}
                  disabled={bulkShare.isPending}
                >
                  <ShareIcon className="mr-2 h-4 w-4" />
                  {bulkShare.isPending ? "Enabling..." : "Enable Sharing"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-md border-2 border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/20">
                <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                  Bulk sharing is currently enabled
                </p>
                <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                  All articles in this feed are publicly accessible
                </p>
              </div>

              {!showConfirm ? (
                <>
                  <p className="text-muted-foreground text-sm">
                    Disabling bulk sharing will make all {articleCount} articles
                    in this feed private again.
                  </p>

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      onClick={handleClose}
                      variant="secondary"
                      disabled={bulkUnshare.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleBulkUnshare}
                      variant="destructive"
                      disabled={bulkUnshare.isPending}
                    >
                      <Share2Icon className="mr-2 h-4 w-4" />
                      Disable Sharing
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-destructive/10 border-destructive rounded-md border-2 p-4">
                    <p className="text-destructive text-sm font-semibold">
                      Are you sure?
                    </p>
                    <p className="text-destructive/80 mt-1 text-xs">
                      This will disable public access to all {articleCount}{" "}
                      articles in this feed. This action can be reversed later.
                    </p>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      onClick={() => setShowConfirm(false)}
                      variant="secondary"
                      disabled={bulkUnshare.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleBulkUnshare}
                      variant="destructive"
                      disabled={bulkUnshare.isPending}
                    >
                      {bulkUnshare.isPending
                        ? "Disabling..."
                        : "Yes, Disable Sharing"}
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
