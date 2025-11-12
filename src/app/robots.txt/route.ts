import { NextResponse } from "next/server"

import { env } from "@/lib/env"

export function GET() {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL

  const robotsTxt = `
User-agent: *
Allow: /
Allow: /s/*
Allow: /share/*
Disallow: /api/*
Disallow: /auth/*

Sitemap: ${baseUrl}/sitemap.xml
`.trim()

  return new NextResponse(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
