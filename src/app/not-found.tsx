import Link from "next/link"
import { HomeIcon, SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold tracking-tight">404</h1>
          <p className="text-muted-foreground mt-4 text-lg">Page not found</p>
          <p className="text-muted-foreground mt-2 text-sm">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            render={(props) => (
              <Link {...props} href="/">
                <HomeIcon className="h-4 w-4" />
                Go home
              </Link>
            )}
            size="lg"
          />
          <Button
            render={(props) => (
              <Link {...props} href="/">
                <SearchIcon className="h-4 w-4" />
                Search articles
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
