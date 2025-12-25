import { createORPCClient, onError } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"

import type { appRouter } from "@/lib/api/root"

export const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin
  // eslint-disable-next-line no-restricted-properties
  return `http://localhost:${process.env["PORT"] ?? 3000}`
}

export const createORPCLink = (
  customFetch?: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>,
) => {
  return new RPCLink({
    url: getBaseUrl() + "/api/orpc",
    fetch:
      customFetch ??
      ((input, init) => {
        return fetch(input, {
          ...init,
          credentials: "include",
        })
      }),
    interceptors: [
      onError((error) => {
        console.error(error)
      }),
    ],
  })
}

export const createORPCClientFromLink = (
  link: ReturnType<typeof createORPCLink>,
): RouterClient<typeof appRouter> => {
  return createORPCClient(link)
}
