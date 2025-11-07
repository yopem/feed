import { TRPCError } from "@trpc/server"

export const handleTRPCError = (error: unknown): never => {
  if (error instanceof TRPCError) {
    throw error
  } else {
    console.error("TRPC Error:", error)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An internal error occurred",
      cause: error,
    })
  }
}
