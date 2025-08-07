"use client"

import { useState } from "react"
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { createTRPCClient, httpBatchStreamLink, loggerLink } from "@trpc/client"
import { createTRPCContext } from "@trpc/tanstack-react-query"
import SuperJSON from "superjson"

import type { AppRouter } from "@/lib/api/root"
import { appEnv } from "@/lib/env/client"
import { createQueryClient } from "./query-client"

let clientQueryClientSingleton: QueryClient | undefined = undefined

const getQueryClient = () => {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return createQueryClient()
  } else {
    // Browser: use singleton pattern to keep the same query client
    return (clientQueryClientSingleton ??= createQueryClient())
  }
}

export const { useTRPC, TRPCProvider } = createTRPCContext<AppRouter>()

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        loggerLink({
          enabled: (op) =>
            appEnv === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        httpBatchStreamLink({
          transformer: SuperJSON,
          url: getBaseUrl() + "/api/trpc",
          // @ts-expect-error FIX: later
          headers() {
            const headers = new Headers()
            headers.set("x-trpc-source", "nextjs-react")
            return headers
          },
        }),
        // httpBatchStreamLink({
        //   transformer: SuperJSON,
        //   url: getBaseUrl() + "/api/trpc",
        //   headers() {
        //     const h = new Headers()
        //     h.set("x-trpc-source", "nextjs-react")
        //
        //     const headers: Record<string, string> = {}
        //     h.forEach((value, key) => {
        //       headers[key] = value
        //     })
        //     return headers
        //   },
        // }),
      ],
    }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  )
}

const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin
  // eslint-disable-next-line no-restricted-properties
  return `http://localhost:${process.env["PORT"] ?? 3000}`
}
