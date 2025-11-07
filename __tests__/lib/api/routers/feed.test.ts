/**
 * Feed Router Structure and Logic Tests
 *
 * Uses static analysis approach to validate router structure and key business logic
 * without requiring server-only module imports or complex mocking
 */
import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "@jest/globals"

describe("Feed Router Structure", () => {
  const routerPath = join(process.cwd(), "src/lib/api/routers/feed.ts")
  const routerSource = readFileSync(routerPath, "utf-8")

  describe("Exported Router", () => {
    it("exports feedRouter as router record", () => {
      expect(routerSource).toContain("export const feedRouter")
      expect(routerSource).toContain("TRPCRouterRecord")
    })

    it("includes JSDoc documentation", () => {
      expect(routerSource).toContain("/**")
      expect(routerSource).toContain("Feed management router")
    })
  })

  describe("Procedures", () => {
    const procedures = [
      "create",
      "update",
      "delete",
      "all",
      "byId",
      "bySlug",
      "statistics",
      "assignTags",
      "unassignTag",
      "refresh",
    ]

    procedures.forEach((procedure) => {
      it(`defines ${procedure} procedure`, () => {
        const procedureRegex = new RegExp(`${procedure}:\\s*protectedProcedure`)
        expect(routerSource).toMatch(procedureRegex)
      })
    })

    it("all procedures use protectedProcedure", () => {
      const procedureCount = (routerSource.match(/protectedProcedure/g) || [])
        .length
      expect(procedureCount).toBeGreaterThanOrEqual(procedures.length)
    })
  })

  describe("create procedure", () => {
    it("validates URL input", () => {
      expect(routerSource).toContain(".input(")
      expect(routerSource).toContain("z.string().url")
      expect(routerSource).toContain("Please provide a valid URL")
    })

    it("checks for empty URLs", () => {
      expect(routerSource).toContain("trimmedInput")
      expect(routerSource).toContain("Feed URL cannot be empty")
    })

    it("checks for duplicate feeds", () => {
      expect(routerSource).toContain("existingFeed")
      expect(routerSource).toContain("You have already subscribed to this feed")
      expect(routerSource).toContain("CONFLICT")
    })

    it("implements feed parsing timeout", () => {
      expect(routerSource).toContain("timeoutPromise")
      expect(routerSource).toContain("setTimeout")
      expect(routerSource).toContain("15000")
      expect(routerSource).toContain("Feed parsing timed out")
    })

    it("uses Promise.race for timeout", () => {
      expect(routerSource).toContain("Promise.race")
      expect(routerSource).toContain("parseFeed")
    })

    it("generates unique slugs", () => {
      expect(routerSource).toContain("baseSlug")
      expect(routerSource).toContain("slugify")
      expect(routerSource).toContain("while (true)")
      expect(routerSource).toContain("existingSlug")
    })

    it("inserts feed with all required fields", () => {
      expect(routerSource).toContain(".insert(feedTable)")
      expect(routerSource).toContain("title: feedData.title")
      expect(routerSource).toContain("description: feedData.description")
      expect(routerSource).toContain("url: trimmedInput")
      expect(routerSource).toContain("slug")
      expect(routerSource).toContain("userId: ctx.session.id")
    })

    it("handles article insertion", () => {
      expect(routerSource).toContain("feedData.articles")
      expect(routerSource).toContain("articlesToInsert")
      expect(routerSource).toContain(".insert(articleTable)")
    })

    it("invalidates Redis cache", () => {
      expect(routerSource).toContain("redis.invalidatePattern")
      expect(routerSource).toContain("feed:*:user:")
    })

    it("handles errors with handleTRPCError", () => {
      expect(routerSource).toContain("handleTRPCError")
      expect(routerSource).toContain("catch")
    })
  })

  describe("update procedure", () => {
    it("validates input schema", () => {
      expect(routerSource).toContain("z.object")
      expect(routerSource).toContain("id: z.string()")
    })

    it("accepts partial updates", () => {
      expect(routerSource).toMatch(/title.*optional/)
      expect(routerSource).toMatch(/description.*optional/)
    })

    it("checks feed ownership", () => {
      expect(routerSource).toContain("eq(feedTable.userId, ctx.session.id)")
    })

    it("throws NOT_FOUND for missing feed", () => {
      expect(routerSource).toContain("NOT_FOUND")
      expect(routerSource).toContain("Feed not found")
    })

    it("updates feed with new values", () => {
      expect(routerSource).toContain(".update(feedTable)")
      expect(routerSource).toContain("set({")
    })
  })

  describe("delete procedure", () => {
    it("implements soft delete", () => {
      expect(routerSource).toContain('status: "deleted"')
      expect(routerSource).toContain(".update(feedTable)")
    })

    it("soft deletes associated articles", () => {
      expect(routerSource).toContain(".update(articleTable)")
      expect(routerSource).toContain("eq(articleTable.feedId")
    })

    it("verifies feed ownership", () => {
      expect(routerSource).toContain("eq(feedTable.userId, ctx.session.id)")
    })

    it("invalidates multiple caches", () => {
      const cacheInvalidations = routerSource.match(/redis\.invalidatePattern/g)
      expect(cacheInvalidations).toBeTruthy()
      expect(cacheInvalidations!.length).toBeGreaterThan(1)
    })
  })

  describe("all procedure", () => {
    it("implements pagination", () => {
      expect(routerSource).toContain("page: z.number()")
      expect(routerSource).toContain("perPage: z.number()")
      expect(routerSource).toContain("limit:")
      expect(routerSource).toContain("offset:")
    })

    it("filters by user and status", () => {
      expect(routerSource).toContain("eq(feedTable.userId, ctx.session.id)")
      expect(routerSource).toContain('eq(feedTable.status, "published")')
    })

    it("orders by creation date", () => {
      expect(routerSource).toContain("orderBy:")
      expect(routerSource).toContain("createdAt")
    })

    it("includes tags relation", () => {
      expect(routerSource).toContain("with:")
      expect(routerSource).toContain("tags:")
      expect(routerSource).toContain("tag: true")
    })

    it("uses Redis caching", () => {
      expect(routerSource).toContain("redis.getCache")
      expect(routerSource).toContain("redis.setCache")
    })

    it("throws NOT_FOUND when no feeds exist", () => {
      expect(routerSource).toContain("No feeds found for the user")
    })
  })

  describe("byId procedure", () => {
    it("accepts feed ID as input", () => {
      expect(routerSource).toContain("z.string()")
    })

    it("filters by ID and user", () => {
      expect(routerSource).toContain("eq(feedTable.id")
      expect(routerSource).toContain("eq(feedTable.userId, ctx.session.id)")
    })

    it("includes tags", () => {
      expect(routerSource).toContain("tags:")
      expect(routerSource).toContain("with:")
      expect(routerSource).toContain("tag: true")
    })

    it("uses Redis cache", () => {
      expect(routerSource).toContain("feed:feed:")
      expect(routerSource).toContain("redis.getCache")
    })
  })

  describe("bySlug procedure", () => {
    it("accepts slug as string input", () => {
      expect(routerSource).toContain(".input(z.string())")
    })

    it("queries by slug and user", () => {
      expect(routerSource).toContain("eq(feedTable.slug")
      expect(routerSource).toContain("eq(feedTable.userId, ctx.session.id)")
    })

    it("filters out deleted feeds", () => {
      expect(routerSource).toContain('eq(feedTable.status, "published")')
    })
  })

  describe("statistics procedure", () => {
    it("queries article statistics", () => {
      expect(routerSource).toContain("articleTable.feedId")
      expect(routerSource).toContain("COUNT")
    })

    it("groups by feed", () => {
      expect(routerSource).toContain(".groupBy")
      expect(routerSource).toContain("feedId")
    })

    it("calculates unread count", () => {
      expect(routerSource).toContain("isRead")
      expect(routerSource).toContain("unreadCount")
    })

    it("calculates starred count", () => {
      expect(routerSource).toContain("isStarred")
      expect(routerSource).toContain("starredCount")
    })

    it("uses Redis cache", () => {
      expect(routerSource).toContain("feed:statistics")
    })
  })

  describe("assignTags procedure", () => {
    it("accepts feedId and tagIds", () => {
      expect(routerSource).toContain("feedId: z.string()")
      expect(routerSource).toContain("tagIds: z.array(z.string())")
    })

    it("validates feed ownership", () => {
      expect(routerSource).toContain("eq(feedTable.userId, ctx.session.id)")
    })

    it("validates tag ownership", () => {
      expect(routerSource).toContain("inArray(tagTable.id")
      expect(routerSource).toContain("eq(tagTable.userId, ctx.session.id)")
    })

    it("deletes existing tag assignments", () => {
      expect(routerSource).toContain(".delete(feedTagsTable)")
      expect(routerSource).toContain("eq(feedTagsTable.feedId")
    })

    it("inserts new tag assignments", () => {
      expect(routerSource).toContain(".insert(feedTagsTable)")
      expect(routerSource).toContain("feedId:")
      expect(routerSource).toContain("tagId:")
    })

    it("throws error for missing tags", () => {
      expect(routerSource).toContain("One or more tags not found")
    })
  })

  describe("unassignTag procedure", () => {
    it("accepts feedId and tagId", () => {
      expect(routerSource).toContain("feedId: z.string()")
      expect(routerSource).toContain("tagId: z.string()")
    })

    it("deletes tag assignment", () => {
      expect(routerSource).toContain(".delete(feedTagsTable)")
      expect(routerSource).toContain("eq(feedTagsTable.feedId")
      expect(routerSource).toContain("eq(feedTagsTable.tagId")
    })

    it("validates feed ownership", () => {
      expect(routerSource).toContain("eq(feedTable.userId, ctx.session.id)")
    })
  })

  describe("refresh procedure", () => {
    it("accepts feed ID", () => {
      expect(routerSource).toContain(".input(z.string())")
    })

    it("fetches existing feed", () => {
      expect(routerSource).toContain(".findFirst")
      expect(routerSource).toContain("eq(feedTable.id")
    })

    it("parses feed again", () => {
      expect(routerSource).toContain("parseFeed")
      expect(routerSource).toContain("existingFeed.url")
    })

    it("queries existing articles", () => {
      expect(routerSource).toContain("articleTable.feedId")
      expect(routerSource).toContain("link: true")
    })

    it("filters new articles", () => {
      expect(routerSource).toContain(".filter")
      expect(routerSource).toContain("existingLinks")
    })

    it("inserts only new articles", () => {
      expect(routerSource).toContain(".insert(articleTable)")
      expect(routerSource).toContain("newArticles")
    })

    it("returns new article count", () => {
      expect(routerSource).toContain("newArticles:")
      expect(routerSource).toContain(".length")
    })

    it("invalidates caches", () => {
      expect(routerSource).toContain("redis.invalidatePattern")
      expect(routerSource).toContain("redis.deleteCache")
    })
  })

  describe("Error Handling", () => {
    it("uses try-catch for all mutations", () => {
      const tryCount = (routerSource.match(/try\s*{/g) || []).length
      const mutationCount = (routerSource.match(/\.mutation\(/g) || []).length
      expect(tryCount).toBeGreaterThanOrEqual(mutationCount)
    })

    it("imports handleTRPCError utility", () => {
      expect(routerSource).toContain("import { handleTRPCError }")
    })

    it("uses TRPCError for validation errors", () => {
      expect(routerSource).toContain("throw new TRPCError")
    })
  })

  describe("Type Safety", () => {
    it("imports required types", () => {
      expect(routerSource).toContain("type SelectFeed")
    })

    it("imports schema tables", () => {
      expect(routerSource).toContain("articleTable")
      expect(routerSource).toContain("feedTable")
      expect(routerSource).toContain("feedTagsTable")
      expect(routerSource).toContain("tagTable")
    })

    it("uses Zod for input validation", () => {
      expect(routerSource).toContain('import z from "zod"')
    })
  })

  describe("Redis Integration", () => {
    it("uses Redis for caching", () => {
      const redisCalls = routerSource.match(/ctx\.redis\./g) || []
      expect(redisCalls.length).toBeGreaterThan(5)
    })

    it("implements cache invalidation", () => {
      expect(routerSource).toContain("invalidatePattern")
      expect(routerSource).toContain("deleteCache")
    })

    it("uses consistent cache key patterns", () => {
      expect(routerSource).toContain("feed:")
      expect(routerSource).toContain("user:")
    })
  })

  describe("Database Operations", () => {
    it("uses Drizzle ORM query builder", () => {
      expect(routerSource).toContain("ctx.db.query")
      expect(routerSource).toContain("ctx.db.insert")
      expect(routerSource).toContain(".update(feedTable)")
    })

    it("uses .returning() for inserts", () => {
      expect(routerSource).toContain(".returning()")
    })

    it("uses proper filtering", () => {
      expect(routerSource).toContain("where:")
      expect(routerSource).toContain("eq(")
      expect(routerSource).toContain("and(")
    })
  })
})
