import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "border-border inline-flex shrink-0 items-center justify-center gap-2 rounded border-2 text-sm font-medium whitespace-nowrap transition-all duration-200 outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[4px_4px_0_0_hsl(var(--foreground))] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_hsl(var(--foreground))] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none",
        destructive:
          "bg-destructive text-white shadow-[4px_4px_0_0_hsl(var(--foreground))] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_hsl(var(--foreground))] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none",
        outline:
          "bg-background hover:bg-accent hover:text-accent-foreground shadow-[4px_4px_0_0_hsl(var(--foreground))] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_hsl(var(--foreground))] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[4px_4px_0_0_hsl(var(--foreground))] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_hsl(var(--foreground))] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none",
        ghost:
          "hover:bg-accent hover:text-accent-foreground hover:border-border border-transparent",
        link: "text-primary border-transparent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 shadow-[2px_2px_0_0_hsl(var(--foreground))] hover:shadow-[1px_1px_0_0_hsl(var(--foreground))] has-[>svg]:px-2.5",
        xs: "h-7 gap-1.5 px-2.5 shadow-[2px_2px_0_0_hsl(var(--foreground))] hover:shadow-[1px_1px_0_0_hsl(var(--foreground))] has-[>svg]:px-2",
        lg: "h-10 px-6 shadow-[6px_6px_0_0_hsl(var(--foreground))] hover:shadow-[3px_3px_0_0_hsl(var(--foreground))] has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-xs": "size-7",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
