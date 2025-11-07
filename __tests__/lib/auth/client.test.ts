/**
 * @jest-environment node
 */
import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "@jest/globals"

describe("Auth Client", () => {
  const clientPath = join(__dirname, "../../../src/lib/auth/client.ts")
  const clientSource = readFileSync(clientPath, "utf-8")

  it("exports authClient", () => {
    expect(clientSource).toContain("export const authClient")
  })

  it("creates client with required configuration", () => {
    expect(clientSource).toContain("createClient")
    expect(clientSource).toContain("clientID")
    expect(clientSource).toContain("issuer")
  })

  it("exports setTokens function", () => {
    expect(clientSource).toContain("export async function setTokens")
  })

  it("setTokens sets httpOnly cookies", () => {
    expect(clientSource).toContain("httpOnly: true")
    expect(clientSource).toContain('sameSite: "lax"')
    expect(clientSource).toContain("access_token")
    expect(clientSource).toContain("refresh_token")
  })

  it("imports from @openauthjs/openauth/client", () => {
    expect(clientSource).toContain("@openauthjs/openauth/client")
  })

  it("imports from next/headers", () => {
    expect(clientSource).toContain("next/headers")
  })
})
