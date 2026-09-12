import "zod/compile"
import { z } from "zod"

export const testEnv = z
  .object({
    RUN_DB_TESTS: z.stringbool().default(false),
    TEST_DATABASE_URL: z.url().optional(),
  })
  .parse({
    RUN_DB_TESTS: import.meta.env.RUN_DB_TESTS,
    TEST_DATABASE_URL: import.meta.env.TEST_DATABASE_URL,
  })

export function configureTestEnvironment() {
  let databaseUrl = "postgres://localhost/feed_test"
  if (testEnv.RUN_DB_TESTS) {
    if (!testEnv.TEST_DATABASE_URL)
      throw new Error("Set TEST_DATABASE_URL for database tests")
    const url = new URL(testEnv.TEST_DATABASE_URL)
    if (
      !url.pathname.endsWith("_test") ||
      !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    ) {
      throw new Error("Database tests require a local database ending in _test")
    }
    databaseUrl = testEnv.TEST_DATABASE_URL
  }
  Object.assign(import.meta.env, {
    NODE_ENV: "test",
    DATABASE_URL: databaseUrl,
    REDIS_URL: "redis://localhost:6379/15",
    WEB_URL: "http://localhost:3000",
    AUTH_ISSUER: "https://auth.yopem.com",
    AUTH_CLIENT_ID: "yopem",
    AUTH_CALLBACK_URL: "http://localhost:4000/auth/callback",
    COOKIE_DOMAIN: "",
    AUTH_SIGNUP_ENABLED: "false",
    OPENAPI_ENABLED: "false",
  })
}
