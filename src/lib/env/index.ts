/* eslint-disable no-restricted-properties */

import { createEnv } from "@t3-oss/env-nextjs"
import z from "zod"

import "dotenv/config"

function getProtocol() {
  if (process.env["APP_ENV"] === "development") {
    return "http://"
  }
  return "https://"
}

export const env = createEnv({
  shared: {
    APP_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  server: {
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),

    AUTH_ISSUER: z.string().min(1),

    CF_ACCOUNT_ID: z.string().min(1),
    R2_ACCESS_KEY: z.string().min(1),
    R2_SECRET_KEY: z.string().min(1),
    R2_BUCKET: z.string().min(1),
    R2_DOMAIN: z.string().min(1),
    R2_REGION: z.string().min(1),

    CRON_SECRET: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_API_URL: z.string().min(1),

    NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().min(1),

    NEXT_PUBLIC_LOGO_URL: z.string().min(1),
    NEXT_PUBLIC_LOGO_OG_URL: z.string().min(1),
    NEXT_PUBLIC_LOGO_OG_WIDTH: z.string().min(1),
    NEXT_PUBLIC_LOGO_OG_HEIGHT: z.string().min(1),

    NEXT_PUBLIC_SITE_DESCRIPTION: z.string().min(1),
    NEXT_PUBLIC_SITE_DOMAIN: z.string().min(1),
    NEXT_PUBLIC_SITE_TAGLINE: z.string().min(1),
    NEXT_PUBLIC_SITE_TITLE: z.string().min(1),
    NEXT_PUBLIC_SITE_URL: z.string().min(1),
    NEXT_PUBLIC_SUPPORT_EMAIL: z.string().min(1),

    NEXT_PUBLIC_FACEBOOK_USERNAME: z.string().min(1),
    NEXT_PUBLIC_INSTAGRAM_USERNAME: z.string().min(1),
    NEXT_PUBLIC_TIKTOK_USERNAME: z.string().min(1),
    NEXT_PUBLIC_WHATSAPP_CHANNEL_USERNAME: z.string().min(1),
    NEXT_PUBLIC_X_USERNAME: z.string().min(1),
    NEXT_PUBLIC_YOUTUBE_USERNAME: z.string().min(1),
  },
  experimental__runtimeEnv: {
    APP_ENV: process.env["APP_ENV"] ?? "development",
    NEXT_PUBLIC_API_URL: `${getProtocol()}${process.env["NEXT_PUBLIC_SITE_DOMAIN"]}/api`,

    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env["NEXT_PUBLIC_GA_MEASUREMENT_ID"],

    NEXT_PUBLIC_LOGO_URL: process.env["NEXT_PUBLIC_LOGO_URL"],
    NEXT_PUBLIC_LOGO_OG_URL: process.env["NEXT_PUBLIC_LOGO_OG_URL"],
    NEXT_PUBLIC_LOGO_OG_WIDTH: process.env["NEXT_PUBLIC_LOGO_OG_WIDTH"],
    NEXT_PUBLIC_LOGO_OG_HEIGHT: process.env["NEXT_PUBLIC_LOGO_OG_HEIGHT"],

    NEXT_PUBLIC_SITE_DESCRIPTION: process.env["NEXT_PUBLIC_SITE_DESCRIPTION"],
    NEXT_PUBLIC_SITE_DOMAIN: process.env["NEXT_PUBLIC_SITE_DOMAIN"],
    NEXT_PUBLIC_SITE_TAGLINE: process.env["NEXT_PUBLIC_SITE_TAGLINE"],
    NEXT_PUBLIC_SITE_TITLE: process.env["NEXT_PUBLIC_SITE_TITLE"],
    NEXT_PUBLIC_SITE_URL: `${getProtocol()}${process.env["NEXT_PUBLIC_SITE_DOMAIN"]}`,
    NEXT_PUBLIC_SUPPORT_EMAIL: process.env["NEXT_PUBLIC_SUPPORT_EMAIL"],

    NEXT_PUBLIC_FACEBOOK_USERNAME: process.env["NEXT_PUBLIC_FACEBOOK_USERNAME"],
    NEXT_PUBLIC_INSTAGRAM_USERNAME:
      process.env["NEXT_PUBLIC_INSTAGRAM_USERNAME"],
    NEXT_PUBLIC_TIKTOK_USERNAME: process.env["NEXT_PUBLIC_TIKTOK_USERNAME"],
    NEXT_PUBLIC_WHATSAPP_CHANNEL_USERNAME:
      process.env["NEXT_PUBLIC_WHATSAPP_CHANNEL_USERNAME"],
    NEXT_PUBLIC_X_USERNAME: process.env["NEXT_PUBLIC_X_USERNAME"],
    NEXT_PUBLIC_YOUTUBE_USERNAME: process.env["NEXT_PUBLIC_X_USERNAME"],
  },
  skipValidation:
    !!process.env["CI"] || process.env["npm_lifecycle_event"] === "lint",
})
