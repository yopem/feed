import { cookies as getCookies } from "next/headers"
import { createClient } from "@openauthjs/openauth/client"

import { authIssuer } from "@/lib/env/server"

export const authClient = createClient({
  clientID: "yopem-read",
  issuer: authIssuer || "https://auth.yopem.com",
})

/**
 * Sets authentication tokens in HTTP-only cookies
 *
 * Configures cookies with security attributes appropriate for the deployment environment.
 * In production (HTTPS), cookies use the secure flag. In development (HTTP), cookies
 * allow insecure transport for localhost testing.
 *
 * @param access - The access token string
 * @param refresh - The refresh token string
 * @param secure - Whether to set the secure flag (true for HTTPS production, false for HTTP development)
 */
export async function setTokens(
  access: string,
  refresh: string,
  secure = true,
) {
  const cookies = await getCookies()

  cookies.set({
    name: "access_token",
    value: access,
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 34560000,
  })

  cookies.set({
    name: "refresh_token",
    value: refresh,
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 34560000,
  })
}
