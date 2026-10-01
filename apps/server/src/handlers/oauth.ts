import { Hono } from "hono"
import { deleteCookie, getCookie, setCookie } from "hono/cookie"
import {
  clearSessionCookies,
  loginCookieOptions,
  setSessionCookies,
} from "server/lib/cookies"
import { z } from "zod"

import { authClient, callbackUrl } from "auth/client"
import { subjects } from "auth/subjects"
import { provisionUser } from "db/services/users"
import { env } from "env/server"

const challengeSchema = z.object({
  state: z.string().min(1),
  verifier: z.string().min(1),
})

export const oauth = new Hono()
  .get("/login", async (c) => {
    const { challenge, url } = await authClient.authorize(callbackUrl, "code", {
      pkce: true,
      provider: "google",
    })

    setCookie(
      c,
      "oauth_challenge",
      JSON.stringify(challenge),
      loginCookieOptions,
    )

    return c.redirect(url)
  })
  .get("/callback", async (c) => {
    const cookie = getCookie(c, "oauth_challenge")
    deleteCookie(c, "oauth_challenge", loginCookieOptions)
    let value: unknown

    try {
      value = JSON.parse(cookie ?? "null")
    } catch {
      value = null
    }

    const challenge = challengeSchema.safeParse(value)
    const code = c.req.query("code")

    if (
      !challenge.success ||
      !code ||
      c.req.query("state") !== challenge.data.state
    ) {
      return c.json({ error: "Invalid OAuth callback" }, 400)
    }

    const result = await authClient.exchange(
      code,
      callbackUrl,
      challenge.data.verifier,
    )

    if (result.err) return c.json({ error: "Login failed" }, 400)

    const verified = await authClient.verify(subjects, result.tokens.access, {
      audience: env.AUTH_CLIENT_ID,
    })

    if (verified.err || verified.aud !== env.AUTH_CLIENT_ID) {
      return c.json({ error: "Invalid login session" }, 401)
    }

    await provisionUser(
      env.AUTH_ISSUER,
      verified.subject.properties,
      env.AUTH_SIGNUP_ENABLED,
    )
    setSessionCookies(c, result.tokens.access, result.tokens.refresh)

    return c.redirect(new URL(env.WEB_URL).origin)
  })
  .post("/logout", (c) => {
    clearSessionCookies(c)

    return c.json({ ok: true })
  })
