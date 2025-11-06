import { type ReactNode } from "react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SurfaceCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export function SurfaceCard({
  children,
  className,
  hover = false,
  onClick,
}: SurfaceCardProps) {
  return (
    <Card
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
    </Card>
  )
}
