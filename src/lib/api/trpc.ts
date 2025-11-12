import { initTRPC, TRPCError } from "@trpc/server"
import superjson from "superjson"
import z, { ZodError } from "zod"

import { auth } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { createRedisCache } from "@/lib/db/redis"
import { createTokenBucket } from "@/lib/utils/rate-limit"

/**
 * Rate limiter for public endpoints
 * 50 requests per minute per IP
 */
const publicRateLimiter = createTokenBucket<string>(50, 60)

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth()
  const redis = createRedisCache()
  const clientIP =
    opts.headers.get("x-forwarded-for") ??
    opts.headers.get("x-real-ip") ??
    "unknown"

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

/**
 * Rate limiting middleware for public endpoints
 * Limits requests based on client IP address
 */
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

/**
 * Rate-limited public procedure for sensitive public endpoints
 * Use this for endpoints that are accessible without authentication
 * and need protection from abuse
 */
export const rateLimitedPublicProcedure = t.procedure
  .use(timingMiddleware)
  .use(rateLimitMiddleware)

export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session || typeof ctx.session !== "object") {
      throw new TRPCError({ code: "UNAUTHORIZED" })
    }

    return next({
      ctx: {
        session: { ...ctx.session },
      },
    })
  })
