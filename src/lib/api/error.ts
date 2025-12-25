import { ORPCError } from "@orpc/server"

export const handleORPCError = (error: unknown): never => {
  if (error instanceof ORPCError) {
    throw error
  } else {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "An internal error occurred",
      cause: error,
    })
  }
}
