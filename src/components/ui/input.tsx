import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-foreground bg-background h-9 w-full min-w-0 rounded border-2 px-3 py-1 text-base transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-[2px_2px_0_0_hsl(var(--primary))]",
        "aria-invalid:border-destructive aria-invalid:focus:shadow-[2px_2px_0_0_hsl(var(--destructive))]",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
