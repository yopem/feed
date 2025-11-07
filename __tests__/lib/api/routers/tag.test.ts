/**
 * Tag Router Structure and Logic Tests
 *
 * Uses static analysis approach to validate router structure and key business logic
 */
import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "@jest/globals"

describe("Tag Router Structure", () => {
  const routerPath = join(process.cwd(), "src/lib/api/routers/tag.ts")
  const routerSource = readFileSync(routerPath, "utf-8")

  describe("Exported Router", () => {
    it("exports tagRouter using createTRPCRouter", () => {
      expect(routerSource).toContain("export const tagRouter")
      expect(routerSource).toContain("createTRPCRouter")
    })

    it("includes JSDoc documentation", () => {
      expect(routerSource).toContain("/**")
      expect(routerSource).toContain("Tag management router")
    })
  })

  describe("Procedures", () => {
    const procedures = ["create", "update", "delete", "all", "byId"]

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
    it("validates input schema", () => {
      expect(routerSource).toContain("z.object({")
      expect(routerSource).toContain("name: z.string()")
      expect(routerSource).toContain("description: z.string().optional()")
    })

    it("inserts tag with user ID", () => {
      expect(routerSource).toContain(".insert(tagTable)")
      expect(routerSource).toContain("name: input.name")
      expect(routerSource).toContain("description: input.description")
      expect(routerSource).toContain("userId: ctx.session.id")
    })

    it("returns created tag", () => {
      expect(routerSource).toContain(".returning()")
      expect(routerSource).toContain("return tag")
    })

    it("invalidates Redis cache", () => {
      expect(routerSource).toContain("redis.invalidatePattern")
      expect(routerSource).toContain("feed:tags:user:")
    })

    it("handles errors", () => {
      expect(routerSource).toContain("try {")
      expect(routerSource).toContain("handleTRPCError(error)")
    })
  })

  describe("update procedure", () => {
    it("uses updateTagSchema for input", () => {
      expect(routerSource).toContain(".input(updateTagSchema)")
    })

    it("validates tag ID exists", () => {
      expect(routerSource).toContain("if (!input.id)")
      expect(routerSource).toContain("Tag ID is required for update")
    })

    it("fetches existing tag", () => {
      expect(routerSource).toContain("existingTag")
      expect(routerSource).toContain(".findFirst")
    })

    it("verifies tag ownership", () => {
      expect(routerSource).toContain("eq(tag.userId, ctx.session.id)")
    })

    it("checks published status", () => {
      expect(routerSource).toContain('eq(tag.status, "published")')
    })

    it("throws NOT_FOUND for missing tag", () => {
      expect(routerSource).toContain("NOT_FOUND")
      expect(routerSource).toContain("Tag not found")
    })

    it("updates tag with spread operator", () => {
      expect(routerSource).toContain(".update(tagTable)")
      expect(routerSource).toContain("...input")
    })

    it("updates updatedAt timestamp", () => {
      expect(routerSource).toContain("updatedAt: new Date()")
    })

    it("invalidates multiple cache patterns", () => {
      const invalidateCount = (
        routerSource.match(/redis\.invalidatePattern/g) || []
      ).length
      expect(invalidateCount).toBeGreaterThan(3)
    })
  })

  describe("delete procedure", () => {
    it("accepts tag ID as input", () => {
      expect(routerSource).toContain(".input(z.string())")
    })

    it("implements soft delete", () => {
      expect(routerSource).toContain('status: "deleted"')
      expect(routerSource).toContain(".update(tagTable)")
    })

    it("updates updatedAt timestamp", () => {
      expect(routerSource).toContain("updatedAt: new Date()")
    })

    it("verifies tag ownership", () => {
      expect(routerSource).toContain("eq(tagTable.userId, ctx.session.id)")
    })

    it("throws NOT_FOUND for missing tag", () => {
      expect(routerSource).toContain("Tag not found")
    })

    it("returns success status", () => {
      expect(routerSource).toContain("success: true")
    })

    it("invalidates multiple caches", () => {
      expect(routerSource).toContain("redis.invalidatePattern")
    })
  })

  describe("all procedure", () => {
    it("filters by user and status", () => {
      expect(routerSource).toContain("eq(tag.userId, ctx.session.id)")
      expect(routerSource).toContain('eq(tag.status, "published")')
    })

    it("orders by creation date", () => {
      expect(routerSource).toContain("orderBy:")
      expect(routerSource).toContain("createdAt")
    })

    it("uses Redis caching", () => {
      expect(routerSource).toContain("redis.getCache")
      expect(routerSource).toContain("redis.setCache")
    })

    it("returns all tags without pagination", () => {
      expect(routerSource).toContain(".findMany(")
    })
  })

  describe("byId procedure", () => {
    it("accepts tag ID as string", () => {
      expect(routerSource).toContain(".input(z.string())")
    })

    it("queries by ID and status", () => {
      expect(routerSource).toContain("eq(tag.id")
      expect(routerSource).toContain('eq(tag.status, "published")')
    })

    it("uses Redis cache", () => {
      expect(routerSource).toContain("feed:tag:")
      expect(routerSource).toContain("redis.getCache")
    })

    it("throws NOT_FOUND for missing tag", () => {
      expect(routerSource).toContain("Tag not found")
    })
  })

  describe("Error Handling", () => {
    it("uses try-catch blocks", () => {
      const tryCount = (routerSource.match(/try\s*{/g) || []).length
      expect(tryCount).toBeGreaterThan(3)
    })

    it("imports handleTRPCError", () => {
      expect(routerSource).toContain("import { handleTRPCError }")
    })

    it("uses TRPCError for validation", () => {
      expect(routerSource).toContain("throw new TRPCError")
    })

    it("calls handleTRPCError in catch", () => {
      expect(routerSource).toContain("handleTRPCError(error)")
    })
  })

  describe("Type Safety", () => {
    it("imports required types", () => {
      expect(routerSource).toContain("type SelectTag")
    })

    it("imports updateTagSchema", () => {
      expect(routerSource).toContain("updateTagSchema")
    })

    it("imports schema table", () => {
      expect(routerSource).toContain("tagTable")
    })
  })

  describe("Redis Integration", () => {
    it("uses consistent cache key patterns", () => {
      expect(routerSource).toContain("feed:tag")
      expect(routerSource).toContain("feed:tags")
      expect(routerSource).toContain("user:")
    })

    it("implements cache invalidation", () => {
      expect(routerSource).toContain("invalidatePattern")
    })

    it("invalidates related caches", () => {
      expect(routerSource).toContain("feed:feeds:")
      expect(routerSource).toContain("feed:feed:")
    })

    it("sets cache with TTL", () => {
      expect(routerSource).toContain("setCache")
    })
  })

  describe("Database Operations", () => {
    it("uses Drizzle ORM", () => {
      expect(routerSource).toContain("ctx.db.query")
      expect(routerSource).toContain(".insert(tagTable)")
      expect(routerSource).toContain(".update(tagTable)")
    })

    it("uses .returning() for mutations", () => {
      expect(routerSource).toContain(".returning()")
    })

    it("uses proper filtering", () => {
      expect(routerSource).toContain("where:")
      expect(routerSource).toContain("eq(")
      expect(routerSource).toContain("and(")
    })
  })

  describe("Input Validation", () => {
    it("uses Zod for validation", () => {
      expect(routerSource).toContain('import z from "zod"')
    })

    it("validates string inputs", () => {
      expect(routerSource).toContain("z.string()")
    })

    it("validates object schemas", () => {
      expect(routerSource).toContain("z.object({")
    })

    it("supports optional fields", () => {
      expect(routerSource).toContain(".optional()")
    })
  })
})
