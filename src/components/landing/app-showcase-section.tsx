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
              <div className="bg-card border-border relative overflow-hidden rounded-lg border-4 shadow-[8px_8px_0_0_hsl(var(--foreground))] sm:rounded-xl">
                <div className="bg-foreground/5 border-border flex items-center justify-between border-b-4 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full border-2 border-red-500 bg-red-500" />
                    <div className="h-3 w-3 rounded-full border-2 border-yellow-500 bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full border-2 border-green-500 bg-green-500" />
                  </div>
                </div>

                <div className="space-y-4 p-6 sm:p-8">
                  <div className="pt-4">
                    <div className="space-y-3">
                      {[
                        { color: "bg-blue-500" },
                        { color: "bg-green-500" },
                        { color: "bg-purple-500" },
                        { color: "bg-yellow-500" },
                        { color: "bg-red-500" },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="bg-background border-border group flex items-center gap-3 rounded-lg border-2 p-3 transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_hsl(var(--foreground))] active:translate-x-1 active:translate-y-1 active:shadow-none"
                        >
                          <div
                            className={`${item.color} border-foreground h-12 w-12 shrink-0 rounded-md border-2`}
                          />
                          <div className="flex-1 space-y-2">
                            <div className="bg-foreground border-foreground h-3 w-full rounded border-2" />
                            <div className="bg-muted-foreground/40 border-border h-2 w-3/4 rounded border-2" />
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
