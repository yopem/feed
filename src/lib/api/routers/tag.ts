import { TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"
import z from "zod"

import { handleTRPCError } from "@/lib/api/error"
import { createTRPCRouter, protectedProcedure } from "@/lib/api/trpc"
import {
  feedTagsTable,
  tagTable,
  updateTagSchema,
  type SelectTag,
} from "@/lib/db/schema"

export const tagRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const [tag] = await ctx.db
          .insert(tagTable)
          .values({
            name: input.name,
            description: input.description,
            userId: ctx.session.id,
          })
          .returning()

        // Invalidate cache
        await ctx.redis.invalidatePattern(`feed:tags:*:user:${ctx.session.id}`)

        return tag
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  update: protectedProcedure
    .input(updateTagSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        if (!input.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Tag ID is required for update",
          })
        }

        // Verify tag belongs to user
        const existingTag = await ctx.db.query.tagTable.findFirst({
          where: (tag, { eq, and }) =>
            and(eq(tag.id, input.id!), eq(tag.userId, ctx.session.id)),
        })

        if (!existingTag) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tag not found.",
          })
        }

        const [tag] = await ctx.db
          .update(tagTable)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(tagTable.id, input.id))
          .returning()

        // Invalidate cache
        await ctx.redis.invalidatePattern(`feed:*:user:${ctx.session.id}`)

        return tag
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const { eq, and } = await import("drizzle-orm")

        // Verify tag belongs to user
        const existingTag = await ctx.db.query.tagTable.findFirst({
          where: and(
            eq(tagTable.id, input),
            eq(tagTable.userId, ctx.session.id),
          ),
        })

        if (!existingTag) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tag not found.",
          })
        }

        // Delete tag-feed associations first (defensive - CASCADE handles this)
        await ctx.db.delete(feedTagsTable).where(eq(feedTagsTable.tagId, input))

        // Delete tag
        await ctx.db.delete(tagTable).where(eq(tagTable.id, input))

        // Invalidate cache
        await ctx.redis.invalidatePattern(`feed:*:user:${ctx.session.id}`)

        return { success: true }
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  all: protectedProcedure.query(async ({ ctx }) => {
    try {
      const cacheKey = `feed:tags:user:${ctx.session.id}`
      const cached = await ctx.redis.getCache<SelectTag[]>(cacheKey)
      if (cached) {
        return cached
      }
      const tags = await ctx.db.query.tagTable.findMany({
        where: (tag, { eq }) => eq(tag.userId, ctx.session.id),
        orderBy: (tag, { desc }) => desc(tag.createdAt),
      })
      // Return empty array instead of throwing error when no tags exist
      await ctx.redis.setCache(cacheKey, tags, 1800)
      return tags
    } catch (error) {
      handleTRPCError(error)
    }
  }),

  byId: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    try {
      const cacheKey = `feed:tag:${input}:user:${ctx.session.id}`
      const cached = await ctx.redis.getCache<SelectTag>(cacheKey)
      if (cached) {
        return cached
      }
      const tag = await ctx.db.query.tagTable.findFirst({
        where: (tag, { eq }) => eq(tag.id, input),
      })
      if (!tag) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Tag with ID ${input} not found`,
        })
      }
      await ctx.redis.setCache(cacheKey, tag, 1800)
      return tag
    } catch (error) {
      handleTRPCError(error)
    }
  }),
})
