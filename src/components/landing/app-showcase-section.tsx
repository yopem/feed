import { CheckIcon } from "lucide-react"

/**
 * App Showcase section for the landing page
 *
 * Displays a visual representation of the app interface with key features highlighted.
 * Uses a minimal design with feature callouts to showcase the platform's capabilities.
 */
export default function AppShowcaseSection() {
  const highlights = [
    "Beautiful, distraction-free reading interface",
    "Smart article organization and tagging",
    "Full dark mode support for comfortable reading",
    "Lightning-fast performance and instant updates",
  ]

  return (
    <section className="border-border border-b-2 py-16 sm:py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                  A Reading Experience You'll Love
                </h2>
                <p className="text-muted-foreground mt-3 text-sm sm:mt-4 sm:text-base md:text-lg">
                  Every detail is crafted to help you focus on what matters
                  most—great content. Our interface disappears so your reading
                  can shine.
                </p>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {highlights.map((highlight) => (
                  <div
                    key={highlight}
                    className="flex items-start gap-2 sm:gap-3"
                  >
                    <div className="bg-primary/10 border-border mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 sm:h-5 sm:w-5">
                      <CheckIcon
                        className="text-primary h-2.5 w-2.5 sm:h-3 sm:w-3"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="text-xs leading-relaxed sm:text-sm md:text-base">
                      {highlight}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-muted border-border relative overflow-hidden rounded-lg border-2 shadow-[6px_6px_0_0_hsl(var(--foreground))] sm:rounded-xl">
                <div className="border-border border-2 border-b p-2 sm:p-3">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-red-500/60 sm:h-2.5 sm:w-2.5" />
                    <div className="h-2 w-2 rounded-full bg-yellow-500/60 sm:h-2.5 sm:w-2.5" />
                    <div className="h-2 w-2 rounded-full bg-green-500/60 sm:h-2.5 sm:w-2.5" />
                  </div>
                </div>

                <div className="space-y-3 p-4 sm:space-y-4 sm:p-6">
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="bg-muted-foreground/20 h-2.5 w-16 rounded sm:h-3 sm:w-20" />
                    <div className="bg-foreground/90 h-4 w-3/4 rounded sm:h-5" />
                    <div className="bg-muted-foreground/40 h-2 w-full rounded sm:h-2.5" />
                    <div className="bg-muted-foreground/40 h-2 w-5/6 rounded sm:h-2.5" />
                  </div>

                  <div className="border-border border-2 border-t pt-3 sm:pt-4">
                    <div className="space-y-2 sm:space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="hover:bg-background/50 border-border flex gap-2 rounded-lg border-2 p-2 transition-colors sm:gap-3 sm:p-3"
                        >
                          <div className="bg-muted h-12 w-12 shrink-0 rounded sm:h-14 sm:w-14" />
                          <div className="flex-1 space-y-1.5 sm:space-y-2">
                            <div className="bg-foreground/70 h-2.5 w-full rounded sm:h-3" />
                            <div className="bg-muted-foreground/30 h-1.5 w-3/4 rounded sm:h-2" />
                            <div className="bg-muted-foreground/30 h-1.5 w-1/2 rounded sm:h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
