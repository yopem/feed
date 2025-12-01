import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string
  count?: number
  variant?:
    | "article-card"
    | "feed-item"
    | "sidebar-feed"
    | "tag-item"
    | "card"
    | "list"
    | "text"
}

export function LoadingSkeleton({
  className,
  count = 1,
  variant = "card",
}: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i)

  if (variant === "article-card") {
    return (
      <>
        {skeletons.map((i) => (
          <div
            key={i}
            style={{
              width: "100%",
              minWidth: "100%",
              maxWidth: "100%",
              display: "flex",
              flexDirection: "column",
            }}
            className={cn(
              "bg-card text-card-foreground border-border flex animate-pulse flex-col gap-6 rounded-md border p-3 shadow-sm",
              className,
            )}
          >
            <div className="space-y-0 px-6 pb-2">
              <div className="flex items-center gap-2">
                <div className="bg-foreground/10 h-4 w-4 shrink-0 rounded" />
                <div className="bg-foreground/10 h-3 min-w-[200px] flex-1 rounded" />
                <div className="bg-foreground/10 h-2 w-2 shrink-0 rounded-full" />
                <div className="bg-foreground/10 h-3 w-20 shrink-0 rounded" />
              </div>
            </div>

            <div className="px-6 pb-2">
              <div className="flex gap-3">
                {i % 2 === 0 && (
                  <div className="bg-foreground/10 h-16 w-20 shrink-0 rounded-md" />
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="bg-foreground/10 h-5 min-w-[300px] rounded" />
                  <div className="bg-foreground/10 h-5 min-w-[250px] rounded" />
                  <div className="bg-foreground/10 mt-1 h-3.5 min-w-[300px] rounded" />
                  <div className="bg-foreground/10 h-3.5 min-w-[200px] rounded" />
                </div>
              </div>
            </div>

            <div className="hidden px-6 pt-2 pb-3 md:block">
              <div className="h-8" />
            </div>
          </div>
        ))}
      </>
    )
  }

  if (variant === "feed-item") {
    return (
      <>
        {skeletons.map((i) => (
          <div
            key={i}
            className={cn(
              "bg-card text-card-foreground border-border flex animate-pulse flex-col gap-6 rounded-md border p-3 shadow-sm",
              className,
            )}
          >
            <div className="flex items-center gap-3">
              <div className="bg-foreground/10 h-10 w-10 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1">
                <div className="bg-foreground/10 h-3.5 w-2/3 rounded" />
                {i % 3 === 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    <div className="bg-foreground/10 h-5 w-14 rounded-md" />
                    <div className="bg-foreground/10 h-5 w-16 rounded-md" />
                  </div>
                )}
              </div>
              {i % 2 === 0 && (
                <div className="bg-foreground/10 ml-auto h-6 w-9 shrink-0 rounded-md" />
              )}
            </div>
          </div>
        ))}
      </>
    )
  }

  if (variant === "sidebar-feed") {
    return (
      <>
        {skeletons.map((i) => (
          <div
            key={i}
            className={cn(
              "flex animate-pulse items-center gap-2 px-2 py-2",
              className,
            )}
          >
            <div className="bg-foreground/10 h-8 w-8 shrink-0 rounded-full" />
            <div className="bg-foreground/10 h-3.5 flex-1 rounded" />
            {i % 2 === 0 && (
              <div className="bg-foreground/10 ml-auto h-5 w-7 shrink-0 rounded-md" />
            )}
          </div>
        ))}
      </>
    )
  }

  if (variant === "tag-item") {
    return (
      <>
        {skeletons.map((i) => (
          <div
            key={i}
            className={cn(
              "bg-card text-card-foreground border-border flex animate-pulse flex-col gap-6 rounded-md border p-3 shadow-sm",
              className,
            )}
          >
            <div className="flex items-center gap-3">
              <div className="bg-foreground/10 h-10 w-10 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1">
                <div className="bg-foreground/10 mb-1 h-3.5 w-2/3 rounded" />
                <div className="bg-foreground/10 h-3 w-1/2 rounded" />
              </div>
            </div>
          </div>
        ))}
      </>
    )
  }

  if (variant === "card") {
    return (
      <>
        {skeletons.map((i) => (
          <div
            key={i}
            className={cn(
              "bg-card/50",
              "border-border border shadow-sm",
              "rounded-xl",
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
