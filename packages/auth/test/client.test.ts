import { expect, test } from "bun:test"

import { authClient, callbackUrl } from "auth/client"
import { env } from "env/server"

test("authorization uses shared issuer but returns to the Feed callback with PKCE", async () => {
  const { url, challenge } = await authClient.authorize(callbackUrl, "code", {
    pkce: true,
    provider: "google",
  })
  const target = new URL(url)
  expect(target.origin).toBe("https://auth.yopem.com")
  expect(target.pathname).toBe("/authorize")
  expect(target.searchParams.get("client_id")).toBe(env.AUTH_CLIENT_ID)
  expect(target.searchParams.get("redirect_uri")).toBe(
    "http://localhost:4000/auth/callback",
  )
  expect(target.searchParams.get("provider")).toBe("google")
  expect(target.searchParams.get("state")).toBe(challenge.state)
  expect(target.searchParams.get("code_challenge_method")).toBe("S256")
  expect(challenge.verifier).toBeTruthy()
})
