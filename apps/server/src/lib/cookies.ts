import type { Context } from "hono"
import type { CookieOptions } from "hono/utils/cookie"

import { deleteCookie, setCookie } from "hono/cookie"

import { env } from "env/server"

const options: CookieOptions = {
  httpOnly: true,
  path: "/",
  secure: Boolean(env.COOKIE_DOMAIN) || env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "None" : "Lax",
  domain: env.COOKIE_DOMAIN,
}

export const loginCookieOptions: CookieOptions = {
  ...options,
  domain: undefined,
  path: "/auth",
  sameSite: "Lax",
  maxAge: 600,
}

export function setSessionCookies(c: Context, access: string, refresh: string) {
  setCookie(c, "access_token", access, { ...options, maxAge: 86400 })
  setCookie(c, "refresh_token", refresh, { ...options, maxAge: 604800 })
}

export function clearSessionCookies(c: Context) {
  deleteCookie(c, "access_token", options)
  deleteCookie(c, "refresh_token", options)
}
