import { BookOpenIcon, RssIcon, SparklesIcon, TagsIcon } from "lucide-react"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/**
 * Features section for the landing page
 *
 * Showcases the main features of the application in a responsive grid.
 * Each feature includes an icon, title, and description.
 */
export default function FeaturesSection() {
  const features = [
    {
      icon: RssIcon,
      title: "Subscribe to Feeds",
      description:
        "Add unlimited RSS feeds from blogs, news sites, and podcasts. Track all your favorite content sources in one centralized hub without jumping between websites.",
    },
    {
      icon: TagsIcon,
      title: "Organize with Tags",
      description:
        "Group feeds by topics, priorities, or projects with custom tags. Create your perfect organization system and find content exactly when you need it.",
    },
    {
      icon: BookOpenIcon,
      title: "Track Your Reading",
      description:
        "Never lose your place. Mark articles as read or unread, save favorites for later, and maintain a complete history of everything you've consumed.",
    },
    {
      icon: SparklesIcon,
      title: "Clean Reading Experience",
      description:
        "Focus on content, not clutter. Enjoy a beautiful, distraction-free reader with customizable themes that automatically adapts to your preferences.",
    },
  ]

  return (
    <section
      id="features"
      className="relative border-b py-16 sm:py-20 md:py-28"
      aria-labelledby="features-heading"
    >
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="from-background via-primary/5 to-background absolute inset-0 bg-linear-to-b" />
      </div>

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="features-heading"
            className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl"
          >
            Everything You Need
          </h2>
          <p className="text-muted-foreground mt-3 text-sm sm:mt-4 sm:text-base md:text-lg">
            Powerful features to enhance your RSS reading experience
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-5xl sm:mt-16">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card
                  key={feature.title}
                  className="group transition-all hover:shadow-md"
                >
                  <CardHeader className="space-y-3 p-5 sm:space-y-4 sm:p-6">
                    <div className="bg-muted inline-flex h-10 w-10 items-center justify-center rounded-lg sm:h-12 sm:w-12">
                      <Icon
                        className="text-foreground h-5 w-5 sm:h-6 sm:w-6"
                        aria-hidden="true"
                      />
                    </div>
                    <CardTitle className="text-lg font-semibold sm:text-xl">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed sm:text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
