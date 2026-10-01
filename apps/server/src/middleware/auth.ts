import type { Context } from "hono"

import { getCookie } from "hono/cookie"
import { createMiddleware } from "hono/factory"
import { clearSessionCookies, setSessionCookies } from "server/lib/cookies"

import { authClient } from "auth/client"
import { subjects } from "auth/subjects"
import { findUser } from "db/services/users"
import { env } from "env/server"

export interface AuthContext {
  Variables: { user: { id: string; name: string; email: string } }
}

export async function sessionUser(c: Context) {
  let access = getCookie(c, "access_token")
  const refresh = getCookie(c, "refresh_token")

  if (!access && !refresh) return null

  if (!access && refresh) {
    const renewed = await authClient.refresh(refresh)

    if (renewed.err || !renewed.tokens) {
      clearSessionCookies(c)

      return null
    }

    access = renewed.tokens.access
    setSessionCookies(c, renewed.tokens.access, renewed.tokens.refresh)
  }

  const verified = await authClient.verify(subjects, access ?? "", {
    refresh,
    audience: env.AUTH_CLIENT_ID,
  })

  if (verified.err || verified.aud !== env.AUTH_CLIENT_ID) {
    clearSessionCookies(c)

    return null
  }

  if (verified.tokens)
    setSessionCookies(c, verified.tokens.access, verified.tokens.refresh)

  return findUser(env.AUTH_ISSUER, verified.subject.properties.id)
}

export const requireAuth = createMiddleware<AuthContext>(async (c, next) => {
  const user = await sessionUser(c)

  if (!user) return c.json({ error: "Authentication required" }, 401)
  c.set("user", user)
  await next()
})
