import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground border-foreground bg-background flex field-sizing-content min-h-16 w-full rounded border-2 px-3 py-2 text-base transition-all outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-[2px_2px_0_0_hsl(var(--primary))]",
        "aria-invalid:border-destructive aria-invalid:focus:shadow-[2px_2px_0_0_hsl(var(--destructive))]",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
