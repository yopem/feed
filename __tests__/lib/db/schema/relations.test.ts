import { describe, expect, it } from "@jest/globals"

import { articleRelations, articleTable } from "@/lib/db/schema/article"
import {
  feedRelations,
  feedTagsRelations,
  feedTagsTable,
} from "@/lib/db/schema/feed"
import { tagRelations } from "@/lib/db/schema/tag"

describe("Database Relations", () => {
  describe("Feed Relations", () => {
    it("feed has relations defined", () => {
      expect(feedRelations).toBeDefined()
    })

    it("feedTags has relations defined", () => {
      expect(feedTagsRelations).toBeDefined()
    })

    it("feedTags table has feedId and tagId columns", () => {
      const feedIdColumn = feedTagsTable.feedId
      const tagIdColumn = feedTagsTable.tagId

      expect(feedIdColumn).toBeDefined()
      expect(tagIdColumn).toBeDefined()
    })
  })

  describe("Article Relations", () => {
    it("article has relations defined", () => {
      expect(articleRelations).toBeDefined()
    })

    it("article table has feedId column", () => {
      const feedIdColumn = articleTable.feedId
      expect(feedIdColumn).toBeDefined()
    })
  })

  describe("Tag Relations", () => {
    it("tag has relations defined", () => {
      expect(tagRelations).toBeDefined()
    })
  })

  describe("Foreign Key Columns", () => {
    it("article has feedId foreign key", () => {
      const columns = Object.keys(articleTable)
      expect(columns).toContain("feedId")
      expect(columns).toContain("userId")
    })

    it("feedTags has foreign keys", () => {
      const columns = Object.keys(feedTagsTable)
      expect(columns).toContain("feedId")
      expect(columns).toContain("tagId")
    })
  })
})
