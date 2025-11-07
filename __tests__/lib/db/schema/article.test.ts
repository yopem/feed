import { describe, expect, it } from "@jest/globals"

import {
  articleTable,
  insertArticleSchema,
  updateArticleSchema,
} from "@/lib/db/schema/article"

describe("Article Schema", () => {
  describe("articleTable", () => {
    it("has all required columns", () => {
      const columns = Object.keys(articleTable)
      expect(columns).toContain("id")
      expect(columns).toContain("title")
      expect(columns).toContain("slug")
      expect(columns).toContain("description")
      expect(columns).toContain("content")
      expect(columns).toContain("link")
      expect(columns).toContain("imageUrl")
      expect(columns).toContain("source")
      expect(columns).toContain("pubDate")
      expect(columns).toContain("isRead")
      expect(columns).toContain("isReadLater")
      expect(columns).toContain("isStarred")
      expect(columns).toContain("userId")
      expect(columns).toContain("feedId")
      expect(columns).toContain("status")
      expect(columns).toContain("createdAt")
      expect(columns).toContain("updatedAt")
    })
  })

  describe("insertArticleSchema validation", () => {
    it("validates correct article data", () => {
      const validArticle = {
        title: "Test Article",
        slug: "test-article",
        description: "Test description",
        link: "https://example.com/article",
        source: "Test Feed",
        pubDate: new Date("2024-01-01"),
        userId: "user_123",
        feedId: "feed_123",
      }

      const result = insertArticleSchema.safeParse(validArticle)
      expect(result.success).toBe(true)
    })

    it("requires title field", () => {
      const invalidArticle = {
        slug: "test-article",
        description: "Test description",
        link: "https://example.com/article",
        source: "Test Feed",
        pubDate: new Date("2024-01-01"),
        userId: "user_123",
        feedId: "feed_123",
      }

      const result = insertArticleSchema.safeParse(invalidArticle)
      expect(result.success).toBe(false)
    })

    it("requires slug field", () => {
      const invalidArticle = {
        title: "Test Article",
        description: "Test description",
        link: "https://example.com/article",
        source: "Test Feed",
        pubDate: new Date("2024-01-01"),
        userId: "user_123",
        feedId: "feed_123",
      }

      const result = insertArticleSchema.safeParse(invalidArticle)
      expect(result.success).toBe(false)
    })

    it("requires description field", () => {
      const invalidArticle = {
        title: "Test Article",
        slug: "test-article",
        link: "https://example.com/article",
        source: "Test Feed",
        pubDate: new Date("2024-01-01"),
        userId: "user_123",
        feedId: "feed_123",
      }

      const result = insertArticleSchema.safeParse(invalidArticle)
      expect(result.success).toBe(false)
    })

    it("requires link field", () => {
      const invalidArticle = {
        title: "Test Article",
        slug: "test-article",
        description: "Test description",
        source: "Test Feed",
        pubDate: new Date("2024-01-01"),
        userId: "user_123",
        feedId: "feed_123",
      }

      const result = insertArticleSchema.safeParse(invalidArticle)
      expect(result.success).toBe(false)
    })

    it("requires source field", () => {
      const invalidArticle = {
        title: "Test Article",
        slug: "test-article",
        description: "Test description",
        link: "https://example.com/article",
        pubDate: new Date("2024-01-01"),
        userId: "user_123",
        feedId: "feed_123",
      }

      const result = insertArticleSchema.safeParse(invalidArticle)
      expect(result.success).toBe(false)
    })

    it("requires pubDate field", () => {
      const invalidArticle = {
        title: "Test Article",
        slug: "test-article",
        description: "Test description",
        link: "https://example.com/article",
        source: "Test Feed",
        userId: "user_123",
        feedId: "feed_123",
      }

      const result = insertArticleSchema.safeParse(invalidArticle)
      expect(result.success).toBe(false)
    })

    it("requires userId field", () => {
      const invalidArticle = {
        title: "Test Article",
        slug: "test-article",
        description: "Test description",
        link: "https://example.com/article",
        source: "Test Feed",
        pubDate: new Date("2024-01-01"),
        feedId: "feed_123",
      }

      const result = insertArticleSchema.safeParse(invalidArticle)
      expect(result.success).toBe(false)
    })

    it("requires feedId field", () => {
      const invalidArticle = {
        title: "Test Article",
        slug: "test-article",
        description: "Test description",
        link: "https://example.com/article",
        source: "Test Feed",
        pubDate: new Date("2024-01-01"),
        userId: "user_123",
      }

      const result = insertArticleSchema.safeParse(invalidArticle)
      expect(result.success).toBe(false)
    })

    it("accepts optional content field", () => {
      const validArticle = {
        title: "Test Article",
        slug: "test-article",
        description: "Test description",
        content: "Full article content",
        link: "https://example.com/article",
        source: "Test Feed",
        pubDate: new Date("2024-01-01"),
        userId: "user_123",
        feedId: "feed_123",
      }

      const result = insertArticleSchema.safeParse(validArticle)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.content).toBe("Full article content")
      }
    })

    it("accepts optional imageUrl field", () => {
      const validArticle = {
        title: "Test Article",
        slug: "test-article",
        description: "Test description",
        link: "https://example.com/article",
        imageUrl: "https://example.com/image.jpg",
        source: "Test Feed",
        pubDate: new Date("2024-01-01"),
        userId: "user_123",
        feedId: "feed_123",
      }

      const result = insertArticleSchema.safeParse(validArticle)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.imageUrl).toBe("https://example.com/image.jpg")
      }
    })

    it("accepts boolean flags", () => {
      const validArticle = {
        title: "Test Article",
        slug: "test-article",
        description: "Test description",
        link: "https://example.com/article",
        source: "Test Feed",
        pubDate: new Date("2024-01-01"),
        userId: "user_123",
        feedId: "feed_123",
        isRead: true,
        isReadLater: true,
        isStarred: true,
      }

      const result = insertArticleSchema.safeParse(validArticle)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isRead).toBe(true)
        expect(result.data.isReadLater).toBe(true)
        expect(result.data.isStarred).toBe(true)
      }
    })

    it("accepts valid status values", () => {
      const statuses = ["published", "draft", "deleted"]

      statuses.forEach((status) => {
        const validArticle = {
          title: "Test Article",
          slug: "test-article",
          description: "Test description",
          link: "https://example.com/article",
          source: "Test Feed",
          pubDate: new Date("2024-01-01"),
          userId: "user_123",
          feedId: "feed_123",
          status,
        }

        const result = insertArticleSchema.safeParse(validArticle)
        expect(result.success).toBe(true)
      })
    })
  })

  describe("updateArticleSchema validation", () => {
    it("allows partial updates", () => {
      const partialUpdate = {
        title: "Updated Title",
      }

      const result = updateArticleSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
    })

    it("allows updating boolean flags", () => {
      const update = {
        isRead: true,
        isStarred: true,
      }

      const result = updateArticleSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it("allows updating status", () => {
      const update = {
        status: "deleted",
      }

      const result = updateArticleSchema.safeParse(update)
      expect(result.success).toBe(true)
    })
  })
})
