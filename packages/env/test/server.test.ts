import { describe, expect, test } from "bun:test"

import { parseServerEnv } from "env/server"

const required = {
  DATABASE_URL: "postgres://localhost/feed",
  REDIS_URL: "redis://localhost:6379",
}

describe("server environment", () => {
  test("shared issuer and local callback are separate, without Google secrets", () => {
    const value = parseServerEnv(required)
    expect(value.AUTH_ISSUER).toBe("https://auth.yopem.com")
    expect(value.AUTH_CLIENT_ID).toBe("yopem")
    expect(value.AUTH_CALLBACK_URL).toBe("http://localhost:4000/auth/callback")
  })

  test("parses ports and opt-in flags without treating false as truthy", () => {
    const value = parseServerEnv({
      ...required,
      SERVER_PORT: "4100",
      AUTH_SIGNUP_ENABLED: "false",
      COOKIE_DOMAIN: "",
    })
    expect(value.SERVER_PORT).toBe(4100)
    expect(value.AUTH_SIGNUP_ENABLED).toBe(false)
    expect(value.COOKIE_DOMAIN).toBeUndefined()
    expect(value.OPENAPI_ENABLED).toBe(false)
  })

  test("rejects missing database configuration and invalid ports", () => {
    expect(() => parseServerEnv({})).toThrow()
    expect(() => parseServerEnv({ ...required, SERVER_PORT: "0" })).toThrow()
    expect(() => parseServerEnv({ ...required, SERVER_PORT: "abc" })).toThrow()
    expect(() =>
      parseServerEnv({ ...required, AUTH_SIGNUP_ENABLED: "maybe" }),
    ).toThrow()
  })

  test("requires HTTPS for production callbacks and web origins", () => {
    expect(() =>
      parseServerEnv({ ...required, NODE_ENV: "production" }),
    ).toThrow()
    expect(
      parseServerEnv({
        ...required,
        NODE_ENV: "production",
        WEB_URL: "https://feed.example.com",
        AUTH_ISSUER: "https://auth.yopem.com",
        AUTH_CALLBACK_URL: "https://api.example.com/auth/callback",
      }).NODE_ENV,
    ).toBe("production")
  })

  test("rejects non-web protocols and credentials in public URLs", () => {
    expect(() =>
      parseServerEnv({ ...required, WEB_URL: "ftp://example.com" }),
    ).toThrow()
    expect(() =>
      parseServerEnv({
        ...required,
        AUTH_ISSUER: "https://user:pass@example.com",
      }),
    ).toThrow()
  })
})
