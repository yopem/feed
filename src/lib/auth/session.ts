import { cookies as getCookies } from "next/headers"

import { authClient } from "./client"
import { subjects } from "./subjects"

export async function setTokens(access: string, refresh: string) {
  const cookies = await getCookies()

  cookies.set({
    name: "access_token",
    value: access,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 34560000,
  })

  cookies.set({
    name: "refresh_token",
    value: refresh,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 34560000,
  })
}

export async function auth() {
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
}
