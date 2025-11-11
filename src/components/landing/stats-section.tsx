import { InfinityIcon, LockIcon, PaletteIcon, ZapIcon } from "lucide-react"

/**
 * Benefits section highlighting core platform advantages
 *
 * Showcases key benefits and features that make the platform valuable,
 * focusing on genuine product qualities rather than user metrics.
 */
export default function StatsSection() {
  const benefits = [
    {
      icon: InfinityIcon,
      value: "Free",
      label: "Forever",
    },
    {
      icon: ZapIcon,
      value: "Fast",
      label: "Performance",
    },
    {
      icon: LockIcon,
      value: "Private",
      label: "Your Data",
    },
    {
      icon: PaletteIcon,
      value: "Beautiful",
      label: "Interface",
    },
  ]

  return (
    <section className="border-b py-12 sm:py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon
              return (
                <div
                  key={benefit.label}
                  className="flex flex-col items-center text-center"
                >
                  <div className="bg-muted mb-3 flex h-10 w-10 items-center justify-center rounded-lg sm:mb-4 sm:h-12 sm:w-12">
                    <Icon
                      className="text-foreground h-5 w-5 sm:h-6 sm:w-6"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="text-xl font-bold sm:text-2xl lg:text-3xl">
                    {benefit.value}
                  </div>
                  <div className="text-muted-foreground mt-1 text-xs sm:text-sm">
                    {benefit.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
