import { initTRPC, TRPCError } from "@trpc/server"
import superjson from "superjson"
import z, { ZodError } from "zod"

import { auth } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { createRedisCache } from "@/lib/db/redis"
import { appEnv } from "@/lib/env/server"
import { createTokenBucket } from "@/lib/utils/rate-limit"

const publicRateLimiter = createTokenBucket<string>(50, 60)

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth()
  const redis = createRedisCache()

  console.error(
    "[TRPC] Context session:",
    session === false ? "false" : typeof session,
  )

  let clientIP =
    opts.headers.get("x-forwarded-for") ??
    opts.headers.get("x-real-ip") ??
    "unknown"

  if (
    appEnv === "development" &&
    (clientIP === "unknown" ||
      clientIP === "127.0.0.1" ||
      clientIP === "::1" ||
      clientIP.includes("::ffff:192.168.") ||
      clientIP.includes("::ffff:10.") ||
      clientIP.includes("::ffff:172.") ||
      clientIP.includes("::ffff:127.") ||
      clientIP.startsWith("192.168.") ||
      clientIP.startsWith("10.") ||
      clientIP.startsWith("172.") ||
      clientIP.startsWith("127."))
  ) {
    clientIP = "8.8.8.8"
  }

  return {
    db,
    redis,
    session,
    clientIP,
    ...opts,
  }
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError:
        error.cause instanceof ZodError
          ? z.flattenError(error.cause as ZodError<Record<string, unknown>>)
          : null,
    },
  }),
})

export const createCallerFactory = t.createCallerFactory

export const createTRPCRouter = t.router

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now()

  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 400) + 100
    await new Promise((resolve) => setTimeout(resolve, waitMs))
  }

  const result = await next()

  const end = Date.now()
  console.info(`[TRPC] ${path} took ${end - start}ms to execute`)

  return result
})

const rateLimitMiddleware = t.middleware(async ({ ctx, next }) => {
  const clientIP = ctx.clientIP

  if (!publicRateLimiter.consume(clientIP, 1)) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests. Please try again later.",
    })
  }

  return next()
})

export const publicProcedure = t.procedure.use(timingMiddleware)

export const rateLimitedPublicProcedure = t.procedure
  .use(timingMiddleware)
  .use(rateLimitMiddleware)

export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    console.error(
      "[PROTECTED] Session type:",
      typeof ctx.session,
      "value:",
      ctx.session === false ? "false" : "object",
    )

    if (!ctx.session || typeof ctx.session !== "object") {
      console.error("[PROTECTED] UNAUTHORIZED")
      throw new TRPCError({ code: "UNAUTHORIZED" })
    }

    return next({
      ctx: {
        session: { ...ctx.session },
      },
    })
  })
