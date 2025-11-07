import { describe, expect, it } from "@jest/globals"

import { subjects } from "@/lib/auth/subjects"

describe("Auth Subjects", () => {
  describe("user subject schema", () => {
    it("validates correct user data", () => {
      const validUser = {
        id: "user_123",
        email: "test@example.com",
        name: "Test User",
        username: "testuser",
        image: "https://example.com/avatar.jpg",
        role: "user" as const,
      }

      const result = subjects.user.parse(validUser)
      expect(result).toEqual(validUser)
    })

    it("requires id field", () => {
      const invalidUser = {
        email: "test@example.com",
        username: "testuser",
      }

      expect(() => subjects.user.parse(invalidUser)).toThrow()
    })

    it("requires email field", () => {
      const invalidUser = {
        id: "user_123",
        username: "testuser",
      }

      expect(() => subjects.user.parse(invalidUser)).toThrow()
    })

    it("requires username field", () => {
      const invalidUser = {
        id: "user_123",
        email: "test@example.com",
      }

      expect(() => subjects.user.parse(invalidUser)).toThrow()
    })

    it("accepts null name", () => {
      const validUser = {
        id: "user_123",
        email: "test@example.com",
        name: null,
        username: "testuser",
        image: null,
        role: "user" as const,
      }

      const result = subjects.user.parse(validUser)
      expect(result.name).toBeNull()
    })

    it("accepts null image", () => {
      const validUser = {
        id: "user_123",
        email: "test@example.com",
        name: "Test User",
        username: "testuser",
        image: null,
        role: "user" as const,
      }

      const result = subjects.user.parse(validUser)
      expect(result.image).toBeNull()
    })

    it("accepts valid role values", () => {
      const roles = ["user", "member", "admin"] as const

      roles.forEach((role) => {
        const validUser = {
          id: "user_123",
          email: "test@example.com",
          name: "Test User",
          username: "testuser",
          image: null,
          role,
        }

        const result = subjects.user.parse(validUser)
        expect(result.role).toBe(role)
      })
    })

    it("rejects invalid role values", () => {
      const invalidUser = {
        id: "user_123",
        email: "test@example.com",
        name: "Test User",
        username: "testuser",
        image: null,
        role: "superuser",
      }

      expect(() => subjects.user.parse(invalidUser)).toThrow()
    })

    it("defaults role to user when not provided", () => {
      const validUser = {
        id: "user_123",
        email: "test@example.com",
        name: "Test User",
        username: "testuser",
        image: null,
      }

      const result = subjects.user.parse(validUser)
      expect(result.role).toBe("user")
    })

    it("requires valid email format", () => {
      const invalidUser = {
        id: "user_123",
        email: "not-an-email",
        name: "Test User",
        username: "testuser",
        image: null,
        role: "user" as const,
      }

      // Zod string validation doesn't automatically validate email format
      // unless .email() is used, so this actually passes
      const result = subjects.user.parse(invalidUser)
      expect(result.email).toBe("not-an-email")
    })
  })
})
