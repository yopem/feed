"use server"

import { cookies as getCookies, headers as getHeaders } from "next/headers"
import { redirect } from "next/navigation"

import { setTokens } from "@/lib/auth/session"
import { authClient } from "./client"
import { subjects } from "./subjects"

export async function login() {
  const cookies = await getCookies()
  const accessToken = cookies.get("access_token")
  const refreshToken = cookies.get("refresh_token")

  if (accessToken) {
    const verified = await authClient.verify(subjects, accessToken.value, {
      refresh: refreshToken?.value,
    })
    if (!verified.err && verified.tokens) {
      await setTokens(verified.tokens.access, verified.tokens.refresh)
      redirect("/")
    }
  }

  const headers = await getHeaders()
  const host = headers.get("host")
  const protocol = host?.includes("localhost") ? "http" : "https"
  const { url } = await authClient.authorize(
    `${protocol}://${host}/api/auth/callback`,
    "code",
  )
  redirect(url)
}
