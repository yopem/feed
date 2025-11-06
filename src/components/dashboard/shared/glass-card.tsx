import { type ReactNode } from "react"

import { cn } from "@/lib/utils"

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export function GlassCard({
  children,
  className,
  hover = false,
  onClick,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card/50 border-border border backdrop-blur-md",
        "rounded-lg shadow-lg",
        "ring-border/50 ring-1",
        "transition-all duration-200",
        hover &&
          "hover:bg-card/70 cursor-pointer hover:scale-[1.02] hover:shadow-xl",
        className,
      )}
    >
      {children}
    </div>
  )
}
