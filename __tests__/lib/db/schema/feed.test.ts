import { describe, expect, it } from "@jest/globals"

import {
  feedTable,
  feedTagsTable,
  insertFeedSchema,
  updateFeedSchema,
} from "@/lib/db/schema/feed"

describe("Feed Schema", () => {
  describe("feedTable", () => {
    it("has all required columns", () => {
      const columns = Object.keys(feedTable)
      expect(columns).toContain("id")
      expect(columns).toContain("title")
      expect(columns).toContain("url")
      expect(columns).toContain("slug")
      expect(columns).toContain("description")
      expect(columns).toContain("imageUrl")
      expect(columns).toContain("lastUpdated")
      expect(columns).toContain("userId")
      expect(columns).toContain("status")
      expect(columns).toContain("createdAt")
      expect(columns).toContain("updatedAt")
    })
  })

  describe("insertFeedSchema validation", () => {
    it("validates correct feed data", () => {
      const validFeed = {
        title: "Test Feed",
        url: "https://example.com/feed.xml",
        slug: "test-feed",
        userId: "user_123",
      }

      const result = insertFeedSchema.safeParse(validFeed)
      expect(result.success).toBe(true)
    })

    it("requires title field", () => {
      const invalidFeed = {
        url: "https://example.com/feed.xml",
        slug: "test-feed",
        userId: "user_123",
      }

      const result = insertFeedSchema.safeParse(invalidFeed)
      expect(result.success).toBe(false)
    })

    it("requires url field", () => {
      const invalidFeed = {
        title: "Test Feed",
        slug: "test-feed",
        userId: "user_123",
      }

      const result = insertFeedSchema.safeParse(invalidFeed)
      expect(result.success).toBe(false)
    })

    it("requires slug field", () => {
      const invalidFeed = {
        title: "Test Feed",
        url: "https://example.com/feed.xml",
        userId: "user_123",
      }

      const result = insertFeedSchema.safeParse(invalidFeed)
      expect(result.success).toBe(false)
    })

    it("requires userId field", () => {
      const invalidFeed = {
        title: "Test Feed",
        url: "https://example.com/feed.xml",
        slug: "test-feed",
      }

      const result = insertFeedSchema.safeParse(invalidFeed)
      expect(result.success).toBe(false)
    })

    it("accepts optional description field", () => {
      const validFeed = {
        title: "Test Feed",
        url: "https://example.com/feed.xml",
        slug: "test-feed",
        userId: "user_123",
        description: "A test feed description",
      }

      const result = insertFeedSchema.safeParse(validFeed)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.description).toBe("A test feed description")
      }
    })

    it("accepts optional imageUrl field", () => {
      const validFeed = {
        title: "Test Feed",
        url: "https://example.com/feed.xml",
        slug: "test-feed",
        userId: "user_123",
        imageUrl: "https://example.com/image.jpg",
      }

      const result = insertFeedSchema.safeParse(validFeed)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.imageUrl).toBe("https://example.com/image.jpg")
      }
    })

    it("accepts valid status values", () => {
      const statuses = ["published", "draft", "deleted"]

      statuses.forEach((status) => {
        const validFeed = {
          title: "Test Feed",
          url: "https://example.com/feed.xml",
          slug: "test-feed",
          userId: "user_123",
          status,
        }

        const result = insertFeedSchema.safeParse(validFeed)
        expect(result.success).toBe(true)
      })
    })
  })

  describe("updateFeedSchema validation", () => {
    it("allows partial updates", () => {
      const partialUpdate = {
        title: "Updated Title",
      }

      const result = updateFeedSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
    })

    it("allows updating multiple fields", () => {
      const update = {
        title: "Updated Title",
        description: "Updated Description",
        imageUrl: "https://example.com/new-image.jpg",
      }

      const result = updateFeedSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it("allows updating status", () => {
      const update = {
        status: "deleted",
      }

      const result = updateFeedSchema.safeParse(update)
      expect(result.success).toBe(true)
    })
  })

  describe("feedTagsTable", () => {
    it("has feedId and tagId columns", () => {
      const columns = Object.keys(feedTagsTable)
      expect(columns).toContain("feedId")
      expect(columns).toContain("tagId")
    })
  })
})
