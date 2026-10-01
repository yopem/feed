import "zod/compile"
import { z } from "zod"

const serverSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    DATABASE_URL: z.url().refine((value) => /^postgres(ql)?:/.test(value)),
    REDIS_URL: z.url().refine((value) => /^rediss?:/.test(value)),
    SERVER_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    WEB_URL: z.url().default("http://localhost:3000"),
    AUTH_ISSUER: z.url().default("https://auth.yopem.com"),
    AUTH_CLIENT_ID: z.string().min(1).default("yopem"),
    AUTH_CALLBACK_URL: z.url().default("http://localhost:4000/auth/callback"),
    COOKIE_DOMAIN: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().min(1).optional(),
    ),
    AUTH_SIGNUP_ENABLED: z.stringbool().default(true),
    FEED_REFRESH_MINUTES: z.coerce.number().int().min(5).max(1440).default(30),
    OPENAPI_ENABLED: z.stringbool().default(false),
  })
  .superRefine((value, context) => {
    for (const key of [
      "WEB_URL",
      "AUTH_ISSUER",
      "AUTH_CALLBACK_URL",
    ] as const) {
      const url = new URL(value[key])

      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        (value.NODE_ENV === "production" && url.protocol !== "https:")
      ) {
        context.addIssue({
          code: "custom",
          path: [key],
          message:
            "Use an HTTP(S) URL without credentials; production requires HTTPS",
        })
      }
    }
  })

export function parseServerEnv(values: Record<string, unknown>) {
  return serverSchema.parse(values)
}

export const env = parseServerEnv(
  import.meta.env.CI === "true"
    ? {
        DATABASE_URL: "postgres://localhost/feed",
        REDIS_URL: "redis://localhost:6379",
        NODE_ENV: "test",
      }
    : import.meta.env,
)
