import { ORPCError, os } from "@orpc/server"

import { auth } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { createRedisCache } from "@/lib/db/redis"
import { appEnv } from "@/lib/env/server"
import { createTokenBucket } from "@/lib/utils/rate-limit"

const publicRateLimiter = createTokenBucket<string>(50, 60)

export async function createRPCContext(opts: {
  headers: Headers
  request?: Request
}) {
  const getCookiesFromRequest = () => {
    if (opts.request) {
      const cookieHeader = opts.request.headers.get("cookie") ?? ""
      const cookies = new Map()

      cookieHeader.split(";").forEach((cookie) => {
        const [name, value] = cookie.trim().split("=")
        if (name && value) {
          cookies.set(name, { name: name.trim(), value: value.trim() })
        }
      })

      return {
        get: (name: string) => cookies.get(name) ?? null,
      }
    }
    return null
  }

  let session = null

  if (opts.request) {
    const requestCookies = getCookiesFromRequest()
    const accessToken = requestCookies?.get("access_token")
    const refreshToken = requestCookies?.get("refresh_token")

    if (accessToken) {
      const { authClient } = await import("@/lib/auth/client")
      const { subjects } = await import("@/lib/auth/subjects")

      const verified = await authClient.verify(subjects, accessToken.value, {
        refresh: refreshToken?.value,
      })

      if (!verified.err) {
        session = verified.subject.properties
      }
    }
  } else {
    session = await auth()
  }

  const redis = createRedisCache()

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
    headers: opts.headers,
    session,
    db,
    redis,
    clientIP,
  }
}

const o = os.$context<Awaited<ReturnType<typeof createRPCContext>>>()

const timingMiddleware = o.middleware(async ({ next, path }) => {
  const start = Date.now()

  try {
    return await next()
  } finally {
    console.info(
      `[oRPC] ${String(path)} took ${Date.now() - start}ms to execute`,
    )
  }
})

const rateLimitMiddleware = o.middleware(async ({ context, next }) => {
  const clientIP = context.clientIP

  if (!publicRateLimiter.consume(clientIP, 1)) {
    throw new ORPCError("TOO_MANY_REQUESTS", {
      message: "Too many requests. Please try again later.",
    })
  }

  return next()
})

export const publicProcedure = o.use(timingMiddleware)

export const rateLimitedPublicProcedure = o
  .use(timingMiddleware)
  .use(rateLimitMiddleware)

export const protectedProcedure = publicProcedure.use(({ context, next }) => {
  if (!context.session || typeof context.session != "object") {
    throw new ORPCError("UNAUTHORIZED")
  }

  return next({
    context: {
      session: context.session,
    },
  })
})
