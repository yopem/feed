import { expect, test } from "bun:test"
import { app } from "server/index"

test("anonymous session and health need no database", async () => {
  expect(await (await app.request("/rpc/session")).json()).toEqual({
    user: null,
  })
  expect((await app.request("/health")).status).toBe(200)
})

test("API documentation is not exposed when disabled", async () => {
  for (const path of ["/rpc/doc", "/rpc/spec.json"]) {
    expect((await app.request(path)).status).toBe(401)
  }
})

test("Feed does not host a duplicate authorization server", async () => {
  for (const path of [
    "/.well-known/oauth-authorization-server",
    "/auth/issuer/.well-known/oauth-authorization-server",
    "/authorize",
    "/token",
    "/google/callback",
  ]) {
    expect((await app.request(path)).status).toBe(404)
  }
})

test("every private RPC requires authentication", async () => {
  for (const path of ["/workspace/list", "/feed/list", "/article/list"]) {
    const response = await app.request(
      `/rpc${path}?workspaceId=${crypto.randomUUID()}`,
    )
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: "Authentication required" })
  }
  for (const path of [
    "/workspace/create",
    "/feed/add",
    "/feed/remove",
    "/feed/refresh",
    "/article/state",
  ]) {
    const response = await app.request(`/rpc${path}`, {
      method: "POST",
      headers: {
        Origin: "http://localhost:3000",
        "Content-Type": "application/json",
      },
      body: "{}",
    })
    expect(response.status).toBe(401)
  }
})

test("mutations reject absent and foreign origins", async () => {
  for (const path of ["/rpc/workspace/create", "/auth/logout"]) {
    for (const origin of [undefined, "https://evil.example", "null"]) {
      const response = await app.request(path, {
        method: "POST",
        headers: origin ? { Origin: origin } : {},
      })
      expect(response.status).toBe(403)
    }
  }
})

test("OAuth callback rejects missing or mismatched state", async () => {
  const response = await app.request("/auth/callback?code=forged&state=forged")
  expect(response.status).toBe(400)
  expect(await response.json()).toEqual({ error: "Invalid OAuth callback" })
})

test("logout clears cookies and CORS allows only web origin", async () => {
  const response = await app.request("/auth/logout", {
    method: "POST",
    headers: { Origin: "http://localhost:3000" },
  })
  expect(response.status).toBe(200)
  expect(response.headers.get("set-cookie")).toContain("Max-Age=0")
  expect(response.headers.get("access-control-allow-origin")).toBe(
    "http://localhost:3000",
  )
  const foreign = await app.request("/rpc/session", {
    headers: { Origin: "https://evil.example" },
  })
  expect(foreign.headers.get("access-control-allow-origin")).not.toBe(
    "https://evil.example",
  )
})
