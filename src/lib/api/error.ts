import { TRPCError } from "@trpc/server"

export const handleTRPCError = (error: unknown): never => {
  if (error instanceof TRPCError) {
    throw error
  } else {
    // Error is handled by mutation's onError callback with toast notification
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An internal error occurred",
      cause: error,
    })
  }
}
