import type React from "react"

// Adapted from https://coss.com/ui/r/spinner.json (MIT).
import { Loader2Icon } from "lucide-react"

type SpinnerProps = React.ComponentProps<typeof Loader2Icon> & {
  "data-slot"?: string
}

export function Spinner({
  className,
  "data-slot": dataSlot,
  ...props
}: SpinnerProps) {
  return (
    <output aria-label="Loading" className={className} data-slot={dataSlot}>
      <Loader2Icon {...props} aria-hidden="true" className="animate-spin" />
    </output>
  )
}
