import { NextResponse, type NextRequest } from "next/server"

import { auth } from "./lib/auth/session"

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/auth/login")) {
    const session = await auth()

    if (session) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }
}
