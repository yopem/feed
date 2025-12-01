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
    <section className="border-border bg-background relative overflow-hidden border-b-2">
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
            <Button
              size="lg"
              className="group w-full sm:w-auto"
              render={(props) => (
                <Link href="/auth/login" {...props}>
                  {props.children}
                </Link>
              )}
            >
              Get Started Free
              <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
              render={(props) => (
                <Link href="#features" {...props}>
                  {props.children}
                </Link>
              )}
            >
              Learn More
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
