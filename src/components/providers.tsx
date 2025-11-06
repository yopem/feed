"use client"

import ThemeProvider from "@/components/theme/theme-provider"
import { TRPCReactProvider } from "@/lib/trpc/client"

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <TRPCReactProvider>{children}</TRPCReactProvider>
    </ThemeProvider>
  )
}

export default Providers
