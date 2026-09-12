import { expect, spyOn, test } from "bun:test"
import { app } from "server/index"

import { authClient } from "auth/client"
import { ServiceError } from "db/services/access"
import * as users from "db/services/users"
import { env } from "env/server"

const profile = {
  id: "external-yopem-user",
  email: "reader@example.com",
  name: null,
}
const challenge = { state: "expected-state", verifier: "pkce-verifier" }
const tokens = {
  access: "test-access",
  refresh: "test-refresh",
  expiresIn: 86400,
}
const cookie = `oauth_challenge=${encodeURIComponent(JSON.stringify(challenge))}`

function mockExchange() {
  return spyOn(authClient, "exchange").mockResolvedValue({ err: false, tokens })
}

function mockVerification(audience = env.AUTH_CLIENT_ID) {
  return spyOn(authClient, "verify").mockResolvedValue({
    aud: audience,
    subject: { type: "user", properties: profile },
  })
}

test("callback verifies and provisions external identity before setting session cookies", async () => {
  const exchange = mockExchange()
  const verify = mockVerification()
  const provision = spyOn(users, "provisionUser").mockResolvedValue({
    id: crypto.randomUUID(),
    issuer: env.AUTH_ISSUER,
    subjectId: profile.id,
    email: profile.email,
    name: profile.email,
  })
  try {
    const response = await app.request(
      "/auth/callback?code=test-code&state=expected-state",
      {
        headers: { Cookie: cookie },
      },
    )
    expect(exchange).toHaveBeenCalledWith(
      "test-code",
      env.AUTH_CALLBACK_URL,
      challenge.verifier,
    )
    expect(verify).toHaveBeenCalledWith(expect.anything(), tokens.access, {
      audience: env.AUTH_CLIENT_ID,
    })
    expect(provision).toHaveBeenCalledWith(env.AUTH_ISSUER, profile, false)
    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toBe(env.WEB_URL)
    expect(response.headers.get("set-cookie")).toContain(
      "access_token=test-access",
    )
  } finally {
    exchange.mockRestore()
    verify.mockRestore()
    provision.mockRestore()
  }
})

test("wrong OAuth state never exchanges the authorization code", async () => {
  const exchange = mockExchange()
  try {
    const response = await app.request(
      "/auth/callback?code=test-code&state=wrong",
      {
        headers: { Cookie: cookie },
      },
    )
    expect(response.status).toBe(400)
    expect(exchange).not.toHaveBeenCalled()
  } finally {
    exchange.mockRestore()
  }
})

test("wrong audience never provisions an account or creates a session", async () => {
  const exchange = mockExchange()
  const verify = mockVerification("other-app")
  const provision = spyOn(users, "provisionUser")
  try {
    const response = await app.request(
      "/auth/callback?code=test-code&state=expected-state",
      {
        headers: { Cookie: cookie },
      },
    )
    expect(response.status).toBe(401)
    expect(provision).not.toHaveBeenCalled()
    expect(response.headers.get("set-cookie")).not.toContain("access_token=")
  } finally {
    exchange.mockRestore()
    verify.mockRestore()
    provision.mockRestore()
  }
})

test("disabled signup cannot leave valid login cookies behind", async () => {
  const exchange = mockExchange()
  const verify = mockVerification()
  const provision = spyOn(users, "provisionUser").mockRejectedValue(
    new ServiceError("Signup is disabled"),
  )
  try {
    const response = await app.request(
      "/auth/callback?code=test-code&state=expected-state",
      {
        headers: { Cookie: cookie },
      },
    )
    expect(response.status).toBe(403)
    expect(response.headers.get("set-cookie")).not.toContain("access_token=")
  } finally {
    exchange.mockRestore()
    verify.mockRestore()
    provision.mockRestore()
  }
})
