import { siteTitle } from "@/lib/env/client"

/**
 * Landing page footer with copyright notice
 */
export default function LandingFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t-2">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <p className="text-muted-foreground text-center text-xs sm:text-sm">
          © {currentYear} {siteTitle}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
