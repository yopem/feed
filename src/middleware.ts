import { NextResponse, type NextRequest } from "next/server"
import { createI18nMiddleware } from "next-international/middleware"

const I18nMiddleware = createI18nMiddleware({
  locales: ["id", "en"],
  defaultLocale: "id",
  urlMappingStrategy: "rewrite",
  resolveLocaleFromRequest: (_request) => {
    return "id"
  },
})

// eslint-disable-next-line @typescript-eslint/require-await
export async function middleware(request: NextRequest): Promise<NextResponse> {
  if (request.method === "GET") {
    const token = request.cookies.get("session")?.value ?? null
    const response = I18nMiddleware(request)

    if (token !== null) {
      response.cookies.set("session", token, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
        httpOnly: true,
        // eslint-disable-next-line no-restricted-properties
        secure: process.env["APP_ENV"] === "production",
      })
    }
    return response
  }

  const originHeader = request.headers.get("Origin")
  const hostHeader = request.headers.get("Host")

  if (originHeader === null || hostHeader === null) {
    return new NextResponse(null, { status: 403 })
  }

  try {
    const origin = new URL(originHeader)
    if (origin.host !== hostHeader) {
      return new NextResponse(null, { status: 403 })
    }
  } catch {
    return new NextResponse(null, { status: 403 })
  }

  return I18nMiddleware(request)
}

export const config = {
  matcher: [
    "/((?!api|static|.*\\..*|_next|favicon|favicon.ico|favicon.png|sw.js|feed|sitemap|icon|robots.txt).*)",
  ],
}
