"use client"

import { NuqsAdapter } from "nuqs/adapters/next/app"

import ThemeProvider from "@/components/theme/theme-provider"
import { AnchoredToastProvider, ToastProvider } from "@/components/ui/toast"
import { QueryProvider } from "@/lib/query/provider"

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <NuqsAdapter>
      <ThemeProvider>
        <ToastProvider>
          <AnchoredToastProvider>
            <QueryProvider>{children}</QueryProvider>
          </AnchoredToastProvider>
        </ToastProvider>
      </ThemeProvider>
    </NuqsAdapter>
  )
}

export default Providers
