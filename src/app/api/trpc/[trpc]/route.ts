import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"

import { appRouter } from "@/lib/api/root"
import { createTRPCContext } from "@/lib/api/trpc"

const handler = async (req: NextRequest) => {
  try {
    const cookieStore = await cookies()

    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext: async () => {
        try {
          const ctx = await createTRPCContext({
            headers: req.headers,
            cookies: cookieStore,
          })
          return ctx
        } catch (error) {
          console.error("[TRPC] Context creation error:", error)
          throw error
        }
      },
      onError: ({ path, error }) => {
        console.error(`[TRPC] Procedure error on ${path}:`, {
          name: error.name,
          message: error.message,
          code: error.code,
          stack: error.stack,
        })
      },
    })

    return response
  } catch (error) {
    console.error("[TRPC] Handler fatal error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 },
    )
  }
}

export { handler as GET, handler as POST }
