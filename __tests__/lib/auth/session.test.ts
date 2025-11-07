/**
 * @jest-environment node
 */
import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "@jest/globals"

describe("Auth Session", () => {
  const sessionPath = join(__dirname, "../../../src/lib/auth/session.ts")
  const sessionSource = readFileSync(sessionPath, "utf-8")

  describe("Module Exports", () => {
    it("exports setTokens function", () => {
      expect(sessionSource).toContain("export async function setTokens")
    })

    it("exports auth function", () => {
      expect(sessionSource).toContain("export const auth")
    })
  })

  describe("setTokens", () => {
    it("accepts access and refresh token parameters", () => {
      expect(sessionSource).toMatch(
        /setTokens\s*\(\s*access\s*:\s*string\s*,\s*refresh\s*:\s*string\s*\)/,
      )
    })

    it("sets access_token cookie with httpOnly and sameSite options", () => {
      expect(sessionSource).toContain("access_token")
      expect(sessionSource).toContain("httpOnly: true")
      expect(sessionSource).toContain('sameSite: "lax"')
    })

    it("sets refresh_token cookie", () => {
      expect(sessionSource).toContain("refresh_token")
    })

    it("sets cookie max age", () => {
      expect(sessionSource).toContain("maxAge: 34560000")
    })
  })

  describe("auth", () => {
    it("is wrapped with React cache()", () => {
      expect(sessionSource).toContain("cache(async ()")
    })

    it("retrieves cookies for authentication", () => {
      expect(sessionSource).toContain("getCookies()")
      expect(sessionSource).toContain("cookies.get")
    })

    it("verifies token using authClient", () => {
      expect(sessionSource).toContain("authClient.verify")
    })

    it("returns false on missing access token", () => {
      expect(sessionSource).toContain("return false")
    })

    it("handles token verification errors", () => {
      expect(sessionSource).toContain("verified.err")
    })

    it("refreshes tokens when provided", () => {
      expect(sessionSource).toContain("verified.tokens")
      expect(sessionSource).toContain("setTokens")
    })

    it("returns user properties on success", () => {
      expect(sessionSource).toContain("verified.subject.properties")
    })
  })
})
