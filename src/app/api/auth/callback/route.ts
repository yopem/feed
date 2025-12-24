import { headers } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"

import { authClient } from "@/lib/auth/client"
import { setTokens } from "@/lib/auth/session"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")

  const headersList = await headers()
  const host =
    headersList.get("x-forwarded-host") ?? headersList.get("host") ?? ""
  const protocol = headersList.get("x-forwarded-proto") ?? "https"
  const origin = `${protocol}://${host}`

  if (!code) {
    console.error("OAuth callback error: Missing authorization code", {
      timestamp: new Date().toISOString(),
      url: req.url,
      origin,
    })
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`)
  }

  const callbackUrl = `${origin}/api/auth/callback`

  const exchanged = await authClient.exchange(code, callbackUrl)

  if (exchanged.err) {
    console.error("OAuth token exchange failed:", {
      timestamp: new Date().toISOString(),
      error: exchanged.err,
      callbackUrl,
      url: req.url,
      origin,
    })
    return NextResponse.redirect(
      `${origin}/auth/login?error=token_exchange_failed`,
    )
  }

  await setTokens(exchanged.tokens.access, exchanged.tokens.refresh)

  return NextResponse.redirect(`${origin}/`)
}
