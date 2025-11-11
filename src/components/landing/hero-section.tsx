import { ArrowRightIcon } from "lucide-react"

import Link from "@/components/link"
import { Button } from "@/components/ui/button"
import { siteDescription, siteTagline, siteTitle } from "@/lib/env/client"

/**
 * Hero section for the landing page
 *
 * Displays the main site title, tagline, description, and primary CTA.
 * Content is sourced from environment variables to allow easy customization.
 */
export default function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="from-primary/10 via-background absolute inset-0 bg-linear-to-br to-purple-500/10" />
        <div className="from-primary/20 absolute top-0 left-1/4 h-96 w-96 animate-pulse rounded-full bg-linear-to-br via-transparent to-transparent blur-3xl" />
        <div className="absolute right-1/4 bottom-0 h-96 w-96 animate-pulse rounded-full bg-linear-to-br from-purple-500/20 via-transparent to-transparent blur-3xl [animation-delay:2s]" />
      </div>

      <div className="container mx-auto px-4 py-16 sm:py-24 md:py-32 lg:py-40">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
            {siteTitle}
          </h1>

          <p className="mt-4 text-lg font-medium sm:mt-6 sm:text-xl md:text-2xl lg:text-3xl">
            {siteTagline}
          </p>

          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-sm leading-relaxed sm:mt-6 sm:text-base md:text-lg">
            {siteDescription}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row">
            <Button asChild size="lg" className="group w-full sm:w-auto">
              <Link href="/auth/login">
                Get Started Free
                <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Link href="#features">Learn More</Link>
            </Button>
          </div>

          <p className="text-muted-foreground mt-4 text-xs sm:mt-6 sm:text-sm">
            No credit card required • Free forever
          </p>
        </div>
      </div>
    </section>
  )
}
