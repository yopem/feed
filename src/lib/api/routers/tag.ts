import { TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"
import z from "zod"

import { handleTRPCError } from "@/lib/api/error"
import { createTRPCRouter, protectedProcedure } from "@/lib/api/trpc"
import { tagTable, updateTagSchema, type SelectTag } from "@/lib/db/schema"

/**
 * Tag management router for organizing feeds into categories
 */
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

        await ctx.redis.invalidatePattern(`feed:tags:user:${ctx.session.id}`)

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

        const existingTag = await ctx.db.query.tagTable.findFirst({
          where: (tag, { eq, and }) =>
            and(
              eq(tag.id, input.id!),
              eq(tag.userId, ctx.session.id),
              eq(tag.status, "published"),
            ),
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

        await ctx.redis.invalidatePattern(`feed:tags:user:${ctx.session.id}`)
        await ctx.redis.invalidatePattern(`feed:tag:*:user:${ctx.session.id}`)
        await ctx.redis.invalidatePattern(`feed:feeds:*:user:${ctx.session.id}`)
        await ctx.redis.invalidatePattern(`feed:feed:*:user:${ctx.session.id}`)

        return tag
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  /**
   * Soft-deletes a tag by updating its status to 'deleted'
   *
   * This operation does not permanently remove the tag from the database.
   * Instead, it marks the tag as deleted. Deleted tags are filtered from
   * all queries and will not appear in feed-tag associations.
   *
   * @param input - Tag ID to delete
   * @returns Success status
   * @throws TRPCError if tag not found or user lacks permission
   */
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const { eq, and } = await import("drizzle-orm")

        const existingTag = await ctx.db.query.tagTable.findFirst({
          where: and(
            eq(tagTable.id, input),
            eq(tagTable.userId, ctx.session.id),
            eq(tagTable.status, "published"),
          ),
        })

        if (!existingTag) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tag not found.",
          })
        }

        await ctx.db
          .update(tagTable)
          .set({ status: "deleted", updatedAt: new Date() })
          .where(eq(tagTable.id, input))

        await ctx.redis.invalidatePattern(`feed:tags:user:${ctx.session.id}`)
        await ctx.redis.invalidatePattern(`feed:tags:*:user:${ctx.session.id}`)
        await ctx.redis.invalidatePattern(`feed:tag:*:user:${ctx.session.id}`)
        await ctx.redis.invalidatePattern(`feed:feeds:*:user:${ctx.session.id}`)
        await ctx.redis.invalidatePattern(`feed:feed:*:user:${ctx.session.id}`)

        return { success: true }
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  /**
   * Toggles the favorited status of a tag
   *
   * Allows users to mark or unmark tags as favorited for quick access
   * and better organization. Favorited status is stored in the database and
   * persists across sessions.
   *
   * @param input - Tag ID and desired favorited state
   * @returns Updated tag data
   * @throws TRPCError if tag not found or user lacks permission
   */
  toggleFavorited: protectedProcedure
    .input(z.object({ id: z.string(), isFavorited: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { eq, and } = await import("drizzle-orm")

        const existingTag = await ctx.db.query.tagTable.findFirst({
          where: and(
            eq(tagTable.id, input.id),
            eq(tagTable.userId, ctx.session.id),
            eq(tagTable.status, "published"),
          ),
        })

        if (!existingTag) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tag not found.",
          })
        }

        const [updatedTag] = await ctx.db
          .update(tagTable)
          .set({ isFavorited: input.isFavorited, updatedAt: new Date() })
          .where(eq(tagTable.id, input.id))
          .returning()

        await ctx.redis.invalidatePattern(`feed:tags:user:${ctx.session.id}`)
        await ctx.redis.invalidatePattern(`feed:tag:*:user:${ctx.session.id}`)

        return updatedTag
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
        where: (tag, { eq, and }) =>
          and(eq(tag.userId, ctx.session.id), eq(tag.status, "published")),
        orderBy: (tag, { desc }) => desc(tag.createdAt),
      })
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
        where: (tag, { eq, and }) =>
          and(eq(tag.id, input), eq(tag.status, "published")),
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
