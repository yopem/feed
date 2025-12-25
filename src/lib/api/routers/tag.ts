import { ORPCError } from "@orpc/server"
import { eq } from "drizzle-orm"
import z from "zod"

import { handleORPCError } from "@/lib/api/error"
import { protectedProcedure } from "@/lib/api/orpc"
import { tagTable, updateTagSchema, type SelectTag } from "@/lib/db/schema"

export const tagRouter = {
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      try {
        const [tag] = await context.db
          .insert(tagTable)
          .values({
            name: input.name,
            description: input.description,
            userId: context.session.id,
          })
          .returning()

        await context.redis.invalidatePattern(
          `feed:tags:user:${context.session.id}`,
        )

        return tag
      } catch (error) {
        handleORPCError(error)
      }
    }),

  update: protectedProcedure
    .input(updateTagSchema)
    .handler(async ({ context, input }) => {
      try {
        if (!input.id) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Tag ID is required for update",
          })
        }

        const existingTag = await context.db.query.tagTable.findFirst({
          where: (tag, { eq, and }) =>
            and(
              eq(tag.id, input.id!),
              eq(tag.userId, context.session.id),
              eq(tag.status, "published"),
            ),
        })

        if (!existingTag) {
          throw new ORPCError("NOT_FOUND", {
            message: "Tag not found.",
          })
        }

        const [tag] = await context.db
          .update(tagTable)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(tagTable.id, input.id))
          .returning()

        await context.redis.invalidatePattern(
          `feed:tags:user:${context.session.id}`,
        )
        await context.redis.invalidatePattern(
          `feed:tag:*:user:${context.session.id}`,
        )
        await context.redis.invalidatePattern(
          `feed:feeds:*:user:${context.session.id}`,
        )
        await context.redis.invalidatePattern(
          `feed:feed:*:user:${context.session.id}`,
        )

        return tag
      } catch (error) {
        handleORPCError(error)
      }
    }),

  delete: protectedProcedure
    .input(z.string())
    .handler(async ({ context, input }) => {
      try {
        const { eq, and } = await import("drizzle-orm")

        const existingTag = await context.db.query.tagTable.findFirst({
          where: and(
            eq(tagTable.id, input),
            eq(tagTable.userId, context.session.id),
            eq(tagTable.status, "published"),
          ),
        })

        if (!existingTag) {
          throw new ORPCError("NOT_FOUND", {
            message: "Tag not found.",
          })
        }

        await context.db
          .update(tagTable)
          .set({ status: "deleted", updatedAt: new Date() })
          .where(eq(tagTable.id, input))

        await context.redis.invalidatePattern(
          `feed:tags:user:${context.session.id}`,
        )
        await context.redis.invalidatePattern(
          `feed:tags:*:user:${context.session.id}`,
        )
        await context.redis.invalidatePattern(
          `feed:tag:*:user:${context.session.id}`,
        )
        await context.redis.invalidatePattern(
          `feed:feeds:*:user:${context.session.id}`,
        )
        await context.redis.invalidatePattern(
          `feed:feed:*:user:${context.session.id}`,
        )

        return { success: true }
      } catch (error) {
        handleORPCError(error)
      }
    }),

  toggleFavorited: protectedProcedure
    .input(z.object({ id: z.string(), isFavorited: z.boolean() }))
    .handler(async ({ context, input }) => {
      try {
        const { eq, and } = await import("drizzle-orm")

        const existingTag = await context.db.query.tagTable.findFirst({
          where: and(
            eq(tagTable.id, input.id),
            eq(tagTable.userId, context.session.id),
            eq(tagTable.status, "published"),
          ),
        })

        if (!existingTag) {
          throw new ORPCError("NOT_FOUND", {
            message: "Tag not found.",
          })
        }

        const [updatedTag] = await context.db
          .update(tagTable)
          .set({ isFavorited: input.isFavorited, updatedAt: new Date() })
          .where(eq(tagTable.id, input.id))
          .returning()

        await context.redis.invalidatePattern(
          `feed:tags:user:${context.session.id}`,
        )
        await context.redis.invalidatePattern(
          `feed:tag:*:user:${context.session.id}`,
        )

        return updatedTag
      } catch (error) {
        handleORPCError(error)
      }
    }),

  all: protectedProcedure.handler(async ({ context }) => {
    try {
      const cacheKey = `feed:tags:user:${context.session.id}`
      const cached = await context.redis.getCache<SelectTag[]>(cacheKey)
      if (cached) {
        return cached
      }
      const tags = await context.db.query.tagTable.findMany({
        where: (tag, { eq, and }) =>
          and(eq(tag.userId, context.session.id), eq(tag.status, "published")),
        orderBy: (tag, { desc }) => desc(tag.createdAt),
      })
      await context.redis.setCache(cacheKey, tags, 1800)
      return tags
    } catch (error) {
      handleORPCError(error)
    }
  }),

  byId: protectedProcedure
    .input(z.string())
    .handler(async ({ context, input }) => {
      try {
        const cacheKey = `feed:tag:${input}:user:${context.session.id}`
        const cached = await context.redis.getCache<SelectTag>(cacheKey)
        if (cached) {
          return cached
        }
        const tag = await context.db.query.tagTable.findFirst({
          where: (tag, { eq, and }) =>
            and(eq(tag.id, input), eq(tag.status, "published")),
        })
        if (!tag) {
          throw new ORPCError("NOT_FOUND", {
            message: `Tag with ID ${input} not found`,
          })
        }
        await context.redis.setCache(cacheKey, tag, 1800)
        return tag
      } catch (error) {
        handleORPCError(error)
      }
    }),
}
