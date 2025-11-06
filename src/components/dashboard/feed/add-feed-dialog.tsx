"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { GlassCard } from "@/components/dashboard/shared/glass-card"
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
      <GlassCard className="w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-foreground text-xl font-bold">Add New Feed</h2>
          <button
            onClick={onClose}
            className="hover:bg-accent rounded-lg p-1 transition-colors"
            aria-label="Close"
          >
            <svg
              className="text-muted-foreground h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="feed-url"
              className="text-foreground mb-2 block text-sm font-medium"
            >
              RSS/Atom Feed URL
            </label>
            <input
              id="feed-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/feed.xml"
              className="bg-input border-border text-foreground placeholder-muted-foreground focus:ring-ring w-full rounded-md border px-4 py-2 focus:ring-2 focus:outline-none"
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
            <button
              type="button"
              onClick={onClose}
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md px-4 py-2 transition-colors"
              disabled={createFeed.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md px-4 py-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              disabled={createFeed.isPending}
            >
              {createFeed.isPending ? "Adding..." : "Add Feed"}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}
