import { TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"
import z from "zod"

import { handleTRPCError } from "@/lib/api/error"
import { createTRPCRouter, protectedProcedure } from "@/lib/api/trpc"
import {
  insertTagSchema,
  tagTable,
  updateTagSchema,
  type SelectTag,
} from "@/lib/db/schema"

export const tagRouter = createTRPCRouter({
  create: protectedProcedure
    .input(insertTagSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const [tag] = await ctx.db.insert(tagTable).values(input).returning()
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
        const [tag] = await ctx.db
          .update(tagTable)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(tagTable.id, input.id))
          .returning()
        return tag
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
      if (tags.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No tags found for the user",
        })
      }
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
