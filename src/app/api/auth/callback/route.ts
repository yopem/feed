import { NextResponse, type NextRequest } from "next/server"

import { authClient } from "@/lib/auth/client"
import { setTokens } from "@/lib/auth/session"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")

  const exchanged = await authClient.exchange(
    code!,
    `${url.origin}/api/auth/callback`,
  )

  if (exchanged.err) return NextResponse.json(exchanged.err, { status: 400 })

  await setTokens(exchanged.tokens.access, exchanged.tokens.refresh)

  return NextResponse.redirect(`${url.origin}/`)
}
