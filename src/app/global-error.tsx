"use client"

import { useEffect } from "react"
import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global error:", error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md text-center">
            <div className="mb-8">
              <div className="bg-destructive/10 text-destructive mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
                <AlertTriangleIcon className="h-8 w-8" />
              </div>
              <h1 className="mb-4 text-3xl font-bold tracking-tight">
                Something went wrong
              </h1>
              <p className="text-muted-foreground mb-2 text-sm">
                An unexpected error occurred. We've been notified and are
                working to fix it.
              </p>
              {error.digest && (
                <p className="text-muted-foreground mt-4 font-mono text-xs">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => reset()} size="lg">
                <RefreshCwIcon className="h-4 w-4" />
                Try again
              </Button>
              <Button
                onClick={() => (window.location.href = "/")}
                variant="outline"
                size="lg"
              >
                Go home
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
