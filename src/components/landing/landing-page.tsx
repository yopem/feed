import AppShowcaseSection from "./app-showcase-section"
import FeaturesSection from "./features-section"
import FinalCTASection from "./final-cta-section"
import HeroSection from "./hero-section"
import HowItWorksSection from "./how-it-works-section"
import LandingFooter from "./landing-footer"
import LandingHeader from "./landing-header"
import StatsSection from "./stats-section"

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
