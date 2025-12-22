import { cache } from "react"
import { cookies as getCookies } from "next/headers"

import { authClient } from "./client"
import { subjects } from "./subjects"

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
  secure: boolean = true,
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

export const auth = cache(async () => {
  const cookies = await getCookies()
  const accessToken = cookies.get("access_token")
  const refreshToken = cookies.get("refresh_token")

  if (!accessToken) {
    return false
  }

  const verified = await authClient.verify(subjects, accessToken.value, {
    refresh: refreshToken?.value,
  })

  if (verified.err) {
    console.error("Error verifying token:", verified.err)

    return false
  }

  if (verified.tokens) {
    await setTokens(verified.tokens.access, verified.tokens.refresh)
  }

  return verified.subject.properties
})
