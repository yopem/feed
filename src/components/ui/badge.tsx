import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "border-border inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded border-2 px-2 py-0.5 text-xs font-bold whitespace-nowrap transition-all [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground [a&]:hover:translate-x-[1px] [a&]:hover:translate-y-[1px]",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:translate-x-[1px] [a&]:hover:translate-y-[1px]",
        destructive:
          "bg-destructive text-white [a&]:hover:translate-x-[1px] [a&]:hover:translate-y-[1px]",
        outline:
          "text-foreground bg-background [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
