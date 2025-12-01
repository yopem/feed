import { ArrowRightIcon } from "lucide-react"

import Link from "@/components/link"
import { Button } from "@/components/ui/button"

/**
 * Final CTA section for the landing page
 *
 * A compelling call-to-action section that encourages users to sign up.
 * Positioned before the footer as the final conversion opportunity.
 */
export default function FinalCTASection() {
  return (
    <section className="bg-muted/30 py-16 sm:py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          <div className="bg-background border-border relative overflow-hidden rounded-xl border-2 p-6 text-center shadow-[6px_6px_0_0_hsl(var(--foreground))] sm:rounded-2xl sm:p-8 md:p-12">
            <div className="relative">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
                Ready to Transform Your Reading?
              </h2>
              <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-sm sm:mt-6 sm:text-base md:text-lg">
                Join readers who've discovered a better way to stay informed.
                Start organizing your favorite content today—completely free,
                forever.
              </p>

              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row">
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

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs sm:mt-6 sm:gap-4 sm:text-sm md:gap-6">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="bg-primary h-1 w-1 rounded-full" />
                  <span className="text-muted-foreground">Free forever</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="bg-primary h-1 w-1 rounded-full" />
                  <span className="text-muted-foreground">
                    No credit card required
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="bg-primary h-1 w-1 rounded-full" />
                  <span className="text-muted-foreground">
                    Setup in minutes
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
