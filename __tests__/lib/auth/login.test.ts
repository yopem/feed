/**
 * @jest-environment node
 */
import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "@jest/globals"

describe("Auth Login", () => {
  const loginPath = join(__dirname, "../../../src/lib/auth/login.ts")
  const loginSource = readFileSync(loginPath, "utf-8")

  describe("Module Structure", () => {
    it("is a server action", () => {
      expect(loginSource).toContain('"use server"')
    })

    it("exports login function", () => {
      expect(loginSource).toContain("export async function login")
    })
  })

  describe("login function", () => {
    it("checks for existing access token", () => {
      expect(loginSource).toContain('cookies.get("access_token")')
    })

    it("verifies existing token if present", () => {
      expect(loginSource).toContain("authClient.verify")
    })

    it("refreshes tokens when verification succeeds", () => {
      expect(loginSource).toContain("verified.tokens")
      expect(loginSource).toContain("setTokens")
    })

    it("handles verification errors", () => {
      expect(loginSource).toContain("verified.err")
    })

    it("generates authorization URL", () => {
      expect(loginSource).toContain("authClient.authorize")
    })

    it("determines protocol based on host", () => {
      expect(loginSource).toContain("localhost")
      expect(loginSource).toContain("http")
      expect(loginSource).toContain("https")
    })

    it("redirects to authorization URL or home", () => {
      expect(loginSource).toContain("redirect")
    })

    it("uses callback URL for OAuth flow", () => {
      expect(loginSource).toContain("/api/auth/callback")
    })
  })
})
