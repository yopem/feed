import { expect, spyOn, test } from "bun:test"
import { Hono } from "hono"
import { sessionUser } from "server/middleware/auth"

import { authClient } from "auth/client"

const profile = {
  id: "shared-user",
  email: "reader@example.com",
  name: "Reader",
}

const route = new Hono().get("/", async (c) =>
  c.json({ user: await sessionUser(c) }),
)

test("rejects verified tokens issued for another audience", async () => {
  const verify = spyOn(authClient, "verify").mockResolvedValue({
    aud: "another-client",
    subject: { type: "user", properties: profile },
  })

  try {
    const response = await route.request("/", {
      headers: { Cookie: "access_token=wrong-audience" },
    })

    expect(await response.json()).toEqual({ user: null })
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0")
  } finally {
    verify.mockRestore()
  }
})

test("refreshes when access cookie has expired out of browser", async () => {
  const refresh = spyOn(authClient, "refresh").mockResolvedValue({
    err: false,
    tokens: {
      access: "renewed-access",
      refresh: "renewed-refresh",
      expiresIn: 86400,
    },
  })

  const verify = spyOn(authClient, "verify").mockResolvedValue({
    aud: "another-client",
    subject: { type: "user", properties: profile },
  })

  try {
    await route.request("/", {
      headers: { Cookie: "refresh_token=old-refresh" },
    })
    expect(refresh).toHaveBeenCalledWith("old-refresh")
    expect(verify).toHaveBeenCalledWith(
      expect.anything(),
      "renewed-access",
      expect.anything(),
    )
  } finally {
    refresh.mockRestore()
    verify.mockRestore()
  }
})
