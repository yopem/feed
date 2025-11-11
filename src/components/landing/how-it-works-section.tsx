import { BookmarkPlusIcon, RssIcon, SparklesIcon } from "lucide-react"

/**
 * How It Works section for the landing page
 *
 * Shows a step-by-step guide of how users can get started with the platform.
 * Uses numbered steps with icons and descriptions to guide users through
 * the onboarding process.
 */
export default function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      icon: RssIcon,
      title: "Add Your Feeds",
      description:
        "Paste any blog or website URL and we'll automatically detect their RSS feed. No technical knowledge required—if they publish content, we'll find it.",
    },
    {
      number: "02",
      icon: BookmarkPlusIcon,
      title: "Organize with Tags",
      description:
        "Create tags like 'Tech News', 'Must Read', or 'Weekend Reading'. Build a system that matches how you think and makes finding content effortless.",
    },
    {
      number: "03",
      icon: SparklesIcon,
      title: "Read and Enjoy",
      description:
        "Dive into your personalized reading experience. No ads, no distractions—just the content you care about, presented beautifully and ready whenever you are.",
    },
  ]

  return (
    <section
      className="bg-muted/30 border-b py-16 sm:py-20 md:py-28"
      aria-labelledby="how-it-works-heading"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="how-it-works-heading"
            className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl"
          >
            How It Works
          </h2>
          <p className="text-muted-foreground mt-3 text-sm sm:mt-4 sm:text-base md:text-lg">
            Get started in minutes with our simple three-step process
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-4xl sm:mt-16">
          <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon

              return (
                <div key={step.number} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4 sm:mb-6">
                      <div className="bg-background flex h-14 w-14 items-center justify-center rounded-2xl border-2 shadow-sm sm:h-16 sm:w-16">
                        <Icon
                          className="text-foreground h-6 w-6 sm:h-7 sm:w-7"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="bg-muted text-muted-foreground absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border text-xs font-bold sm:h-6 sm:w-6">
                        {step.number}
                      </div>
                    </div>

                    <h3 className="mb-2 text-lg font-semibold sm:mb-3 sm:text-xl">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
                      {step.description}
                    </p>
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
