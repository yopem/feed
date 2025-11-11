import AppShowcaseSection from "./app-showcase-section"
import FeaturesSection from "./features-section"
import FinalCTASection from "./final-cta-section"
import HeroSection from "./hero-section"
import HowItWorksSection from "./how-it-works-section"
import LandingFooter from "./landing-footer"
import LandingHeader from "./landing-header"
import StatsSection from "./stats-section"

/**
 * Main landing page component for non-authenticated users
 *
 * Composes multiple sections into a cohesive landing page experience:
 * - Header with navigation and theme switcher
 * - Hero section with main value proposition
 * - Stats section with social proof
 * - Features section highlighting key capabilities
 * - How It Works section with step-by-step guide
 * - App Showcase with visual mockup
 * - Final CTA for conversion
 * - Footer with links and information
 *
 * Displayed when users visit the root path without being authenticated.
 */
export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <AppShowcaseSection />
        <FinalCTASection />
      </main>
      <LandingFooter />
    </div>
  )
}
