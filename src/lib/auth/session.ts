import { cache } from "react"
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

export const auth = cache(async () => {
  try {
    const cookies = await getCookies()
    const accessToken = cookies.get("access_token")
    const refreshToken = cookies.get("refresh_token")

    const allCookies = cookies
      .getAll()
      .map((c) => c.name)
      .join(", ")
    console.error("[AUTH] All cookies:", allCookies)
    console.error("[AUTH] Access token:", accessToken ? "present" : "missing")

    if (!accessToken) {
      return false
    }

    const verified = await authClient.verify(subjects, accessToken.value, {
      refresh: refreshToken?.value,
    })

    if (verified.err) {
      console.error("[AUTH] Verification failed:", verified.err)
      return false
    }

    console.error("[AUTH] Verification successful")
    return verified.subject.properties
  } catch (error) {
    console.error("[AUTH] Exception:", error)
    return false
  }
})
