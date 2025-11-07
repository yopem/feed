/**
 * @jest-environment node
 */
import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "@jest/globals"

describe("Auth Logout", () => {
  const logoutPath = join(__dirname, "../../../src/lib/auth/logout.ts")
  const logoutSource = readFileSync(logoutPath, "utf-8")

  describe("Module Structure", () => {
    it("is a server action", () => {
      expect(logoutSource).toContain('"use server"')
    })

    it("exports logout function", () => {
      expect(logoutSource).toContain("export async function logout")
    })
  })

  describe("logout function", () => {
    it("deletes access_token cookie", () => {
      expect(logoutSource).toContain('cookies.delete("access_token")')
    })

    it("deletes refresh_token cookie", () => {
      expect(logoutSource).toContain('cookies.delete("refresh_token")')
    })

    it("redirects to home page", () => {
      expect(logoutSource).toContain('redirect("/")')
    })
  })
})
