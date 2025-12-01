"use client"

import { NuqsAdapter } from "nuqs/adapters/next/app"

import ThemeProvider from "@/components/theme/theme-provider"
import { AnchoredToastProvider, ToastProvider } from "@/components/ui/toast"
import { TRPCReactProvider } from "@/lib/trpc/client"

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <NuqsAdapter>
      <ThemeProvider>
        <ToastProvider>
          <AnchoredToastProvider>
            <TRPCReactProvider>{children}</TRPCReactProvider>
          </AnchoredToastProvider>
        </ToastProvider>
      </ThemeProvider>
    </NuqsAdapter>
  )
}

export default Providers
