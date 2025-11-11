import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string
  count?: number
  variant?: "card" | "list" | "text"
}

export function LoadingSkeleton({
  className,
  count = 1,
  variant = "card",
}: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i)

  if (variant === "card") {
    return (
      <>
        {skeletons.map((i) => (
          <div
            key={i}
            className={cn(
              "bg-card/50 backdrop-blur-md",
              "border-border border",
              "rounded-xl shadow-lg",
              "animate-pulse p-4",
              className,
            )}
          >
            <div className="bg-muted/50 mb-2 h-4 w-3/4 rounded" />
            <div className="bg-muted/50 h-3 w-1/2 rounded" />
          </div>
        ))}
      </>
    )
  }

  if (variant === "list") {
    return (
      <>
        {skeletons.map((i) => (
          <div
            key={i}
            className={cn(
              "flex animate-pulse items-center gap-3 p-3",
              className,
            )}
          >
            <div className="bg-muted/50 h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1">
              <div className="bg-muted/50 mb-2 h-4 w-2/3 rounded" />
              <div className="bg-muted/50 h-3 w-1/3 rounded" />
            </div>
          </div>
        ))}
      </>
    )
  }

  return (
    <>
      {skeletons.map((i) => (
        <div
          key={i}
          className={cn(
            "bg-muted/50 mb-2 h-4 animate-pulse rounded",
            className,
          )}
        />
      ))}
    </>
  )
}
