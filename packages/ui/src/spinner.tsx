import type React from "react"

// Adapted from https://coss.com/ui/r/spinner.json (MIT).
import { Loader2Icon } from "lucide-react"

import { cn } from "ui/utils"

export function Spinner({
  className,
  ...props
}: React.ComponentProps<typeof Loader2Icon>) {
  return (
    <Loader2Icon
      aria-label="Loading"
      className={cn("animate-spin", className)}
      role="status"
      {...props}
    />
  )
}
