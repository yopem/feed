"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircleIcon, HomeIcon, RefreshCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { appEnv } from "@/lib/env/client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Route error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div className="bg-destructive/10 text-destructive mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
            <AlertCircleIcon className="h-8 w-8" />
          </div>
          <h1 className="mb-4 text-3xl font-bold tracking-tight">
            Oops! Something went wrong
          </h1>
          <p className="text-muted-foreground mb-2 text-sm">
            We encountered an error while loading this page. Please try again or
            return to the homepage.
          </p>
          {appEnv === "development" && (
            <details className="mt-4 rounded-lg border p-4 text-left">
              <summary className="text-muted-foreground cursor-pointer text-xs font-medium">
                Error Details (Development)
              </summary>
              <pre className="text-destructive mt-2 overflow-x-auto text-xs">
                {error.message}
              </pre>
              {error.digest && (
                <p className="text-muted-foreground mt-2 font-mono text-xs">
                  Error ID: {error.digest}
                </p>
              )}
            </details>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => reset()} size="lg">
            <RefreshCwIcon className="h-4 w-4" />
            Try again
          </Button>
          <Button
            render={(props) => (
              <Link {...props} href="/">
                <HomeIcon className="h-4 w-4" />
                Go home
              </Link>
            )}
            variant="outline"
            size="lg"
          />
        </div>
      </div>
    </div>
  )
}
