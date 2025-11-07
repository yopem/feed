"use client"

import { NuqsAdapter } from "nuqs/adapters/next/app"

import ThemeProvider from "@/components/theme/theme-provider"
import { TRPCReactProvider } from "@/lib/trpc/client"

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <NuqsAdapter>
      <ThemeProvider>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </ThemeProvider>
    </NuqsAdapter>
  )
}

export default Providers
