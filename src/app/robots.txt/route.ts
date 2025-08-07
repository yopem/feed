import { NextResponse } from "next/server"

export function GET() {
  const robotsTxt = `
User-agent: *
Allow: /

`.trim()

  return new NextResponse(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
