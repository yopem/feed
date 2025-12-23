import { NextResponse, type NextRequest } from "next/server"

import { authClient, setTokens } from "@/lib/auth/client"
import { isProduction } from "@/lib/utils"

/**
 * OAuth callback endpoint that exchanges authorization code for tokens
 *
 * Handles the OAuth redirect from the authorization server, exchanges the
 * authorization code for access and refresh tokens, sets secure cookies,
 * and redirects to the application home page.
 *
 * Error handling:
 * - Logs comprehensive error details for production debugging
 * - Validates required OAuth parameters (code)
 * - Redirects to login page with error parameter on failure
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const host = req.headers.get("host")

  const protocol =
    req.headers.get("x-forwarded-proto") ??
    (host?.includes("localhost") ? "http" : "https")
  const origin = `${protocol}://${host}`

  if (!code) {
    console.error("OAuth callback error: Missing authorization code", {
      timestamp: new Date().toISOString(),
      url: url.toString(),
      searchParams: Object.fromEntries(url.searchParams.entries()),
    })

    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`, {
      status: 302,
    })
  }

  try {
    const exchanged = await authClient.exchange(
      code,
      `${origin}/api/auth/callback`,
    )

    if (exchanged.err) {
      console.error("OAuth token exchange failed:", {
        timestamp: new Date().toISOString(),
        error: exchanged.err,
        callbackUrl: `${origin}/api/auth/callback`,
        host,
      })

      return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`, {
        status: 302,
      })
    }

    const secure = isProduction(host)
    await setTokens(exchanged.tokens.access, exchanged.tokens.refresh, secure)

    return NextResponse.redirect(`${origin}/`)
  } catch (error) {
    console.error("Unexpected error during OAuth callback:", {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      host,
    })

    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`, {
      status: 302,
    })
  }
}
