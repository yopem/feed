import { describe, expect, it } from "@jest/globals"

import { insertTagSchema, tagTable, updateTagSchema } from "@/lib/db/schema/tag"

describe("Tag Schema", () => {
  describe("tagTable", () => {
    it("has all required columns", () => {
      const columns = Object.keys(tagTable)
      expect(columns).toContain("id")
      expect(columns).toContain("name")
      expect(columns).toContain("description")
      expect(columns).toContain("userId")
      expect(columns).toContain("status")
      expect(columns).toContain("createdAt")
      expect(columns).toContain("updatedAt")
    })
  })

  describe("insertTagSchema validation", () => {
    it("validates correct tag data", () => {
      const validTag = {
        name: "Technology",
        userId: "user_123",
      }

      const result = insertTagSchema.safeParse(validTag)
      expect(result.success).toBe(true)
    })

    it("requires name field", () => {
      const invalidTag = {
        userId: "user_123",
      }

      const result = insertTagSchema.safeParse(invalidTag)
      expect(result.success).toBe(false)
    })

    it("requires userId field", () => {
      const invalidTag = {
        name: "Technology",
      }

      const result = insertTagSchema.safeParse(invalidTag)
      expect(result.success).toBe(false)
    })

    it("accepts optional description field", () => {
      const validTag = {
        name: "Technology",
        description: "Tech-related feeds",
        userId: "user_123",
      }

      const result = insertTagSchema.safeParse(validTag)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.description).toBe("Tech-related feeds")
      }
    })

    it("accepts valid status values", () => {
      const statuses = ["published", "draft", "deleted"]

      statuses.forEach((status) => {
        const validTag = {
          name: "Technology",
          userId: "user_123",
          status,
        }

        const result = insertTagSchema.safeParse(validTag)
        expect(result.success).toBe(true)
      })
    })
  })

  describe("updateTagSchema validation", () => {
    it("allows partial updates", () => {
      const partialUpdate = {
        name: "Updated Name",
      }

      const result = updateTagSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
    })

    it("allows updating description", () => {
      const update = {
        description: "Updated description",
      }

      const result = updateTagSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it("allows updating status", () => {
      const update = {
        status: "deleted",
      }

      const result = updateTagSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it("allows updating multiple fields", () => {
      const update = {
        name: "Updated Name",
        description: "Updated Description",
        status: "draft",
      }

      const result = updateTagSchema.safeParse(update)
      expect(result.success).toBe(true)
    })
  })
})
