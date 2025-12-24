import { cookies } from "next/headers"
import { type NextRequest } from "next/server"
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"

import { appRouter } from "@/lib/api/root"
import { createTRPCContext } from "@/lib/api/trpc"
import { appEnv } from "@/lib/env/server"

const handler = async (req: NextRequest) => {
  const cookieStore = await cookies()

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      return createTRPCContext({
        headers: req.headers,
        cookies: cookieStore,
      })
    },
    onError: ({ path, error }) => {
      console.error(
        `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
        appEnv === "development" ? error.stack : "",
      )
    },
  })
}

export { handler as GET, handler as POST }
