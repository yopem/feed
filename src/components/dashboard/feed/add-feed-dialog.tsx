"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { XIcon } from "lucide-react"

import { SurfaceCard } from "@/components/dashboard/shared/surface-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTRPC } from "@/lib/trpc/client"

interface AddFeedDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function AddFeedDialog({ isOpen, onClose }: AddFeedDialogProps) {
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const createFeed = useMutation(
    trpc.feed.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.feed.pathFilter())
        setUrl("")
        setError(null)
        onClose()
      },
      onError: (err: { message: string }) => {
        setError(err.message)
      },
    }),
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!url.trim()) {
      setError("Please enter a feed URL")
      return
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      setError("Please enter a valid URL")
      return
    }

    createFeed.mutate(url.trim())
  }

  if (!isOpen) return null

  return (
    <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <SurfaceCard className="w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-foreground text-xl font-bold">Add New Feed</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            aria-label="Close"
          >
            <XIcon className="text-muted-foreground h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="feed-url"
              className="text-foreground mb-2 block text-sm font-medium"
            >
              RSS/Atom Feed URL
            </label>
            <Input
              id="feed-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/feed.xml"
              disabled={createFeed.isPending}
            />
            <p className="text-muted-foreground mt-2 text-xs">
              Enter the URL of an RSS or Atom feed. Common paths: /feed, /rss,
              /atom.xml
            </p>
          </div>

          {error && (
            <div className="bg-destructive/20 border-destructive/50 text-destructive rounded-lg border p-3 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              disabled={createFeed.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createFeed.isPending}>
              {createFeed.isPending ? "Adding..." : "Add Feed"}
            </Button>
          </div>
        </form>
      </SurfaceCard>
    </div>
  )
}
