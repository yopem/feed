import React, { type ButtonHTMLAttributes } from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "font-head flex cursor-pointer items-center rounded font-medium outline-hidden transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover border-2 border-black shadow-md transition hover:translate-y-1 hover:shadow active:translate-x-1 active:translate-y-2 active:shadow-none",
        secondary:
          "bg-secondary shadow-primary text-secondary-foreground hover:bg-secondary-hover border-2 border-black shadow-md transition hover:translate-y-1 hover:shadow active:translate-x-1 active:translate-y-2 active:shadow-none",
        outline:
          "border-2 bg-transparent shadow-md transition hover:translate-y-1 hover:shadow active:translate-x-1 active:translate-y-2 active:shadow-none",
        link: "bg-transparent hover:underline",
      },
      size: {
        sm: "px-3 py-1 text-sm shadow hover:shadow-none",
        md: "px-4 py-1.5 text-base",
        lg: "text-md px-6 py-2 lg:px-8 lg:py-3 lg:text-lg",
        icon: "p-2",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  },
)

export interface IButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, IButtonProps>(
  (
    {
      children,
      size = "md",
      className = "",
      variant = "default",
      asChild = false,
      ...props
    }: IButtonProps,
    forwardedRef,
  ) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={forwardedRef}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </Comp>
    )
  },
)

Button.displayName = "Button"
