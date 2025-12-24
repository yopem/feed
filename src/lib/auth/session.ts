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

    if (!verified.subject || !verified.subject.properties) {
      console.error("Token verified but no subject properties found")
      return false
    }

    return verified.subject.properties
  } catch (error) {
    console.error("Unexpected error in auth():", error)
    return false
  }
})
