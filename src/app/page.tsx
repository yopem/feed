import { type Metadata } from "next"

import LandingPage from "@/components/landing/landing-page"
import { auth } from "@/lib/auth/session"
import { siteDescription, siteTagline, siteTitle } from "@/lib/env/client"
import DashboardPage from "./(app)/page"

export const metadata: Metadata = {
  title: `${siteTitle} - ${siteTagline}`,
  description: siteDescription,
  openGraph: {
    title: `${siteTitle} - ${siteTagline}`,
    description: siteDescription,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteTitle} - ${siteTagline}`,
    description: siteDescription,
  },
}

export default async function RootPage() {
  const session = await auth()

  if (session) {
    return <DashboardPage />
  }

  return <LandingPage />
}
