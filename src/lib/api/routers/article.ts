import { TRPCError } from "@trpc/server"
import { and, count, desc, eq } from "drizzle-orm"
import z from "zod"

import { handleTRPCError } from "@/lib/api/error"
import { createTRPCRouter, protectedProcedure } from "@/lib/api/trpc"
import { articleTable, type SelectArticle } from "@/lib/db/schema"

export const articleRouter = createTRPCRouter({
  all: protectedProcedure
    .input(z.object({ page: z.number(), perPage: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const cacheKey = `feed:articles:page:${input.page}:per:${input.perPage}:user:${ctx.session.id}`
        const cached = await ctx.redis.getCache<SelectArticle[]>(cacheKey)
        if (cached) {
          return cached
        }
        const data = await ctx.db.query.articleTable.findMany({
          where: (articleTable, { eq }) =>
            eq(articleTable.userId, ctx.session.id),
          offset: (input.page - 1) * input.perPage,
          limit: input.perPage,
          orderBy: (articles, { desc }) => [desc(articles.createdAt)],
          with: {
            feed: {
              columns: {
                title: true,
                imageUrl: true,
              },
            },
          },
        })
        if (data.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No articles found for the user.",
          })
        }
        await ctx.redis.setCache(cacheKey, data, 1800)
        return data
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  byId: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    try {
      const cacheKey = `feed:article:${input}:user:${ctx.session.id}`
      const cached = await ctx.redis.getCache<SelectArticle>(cacheKey)
      if (cached) {
        return cached
      }
      const data = await ctx.db.query.articleTable.findFirst({
        where: (articleTable, { eq }) => eq(articleTable.id, input),
        with: {
          feed: {
            columns: {
              title: true,
              imageUrl: true,
            },
          },
        },
      })
      if (!data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found.",
        })
      }
      await ctx.redis.setCache(cacheKey, data, 1800)
      return data
    } catch (error) {
      handleTRPCError(error)
    }
  }),

  countByFeedId: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        const cacheKey = `feed:article:count:feed:${input}:user:${ctx.session.id}`
        const cached = await ctx.redis.getCache<number>(cacheKey)
        if (cached) {
          return cached
        }
        await ctx.db
          .select({ count: count() })
          .from(articleTable)
          .where(
            and(
              eq(articleTable.feedId, input),
              eq(articleTable.userId, ctx.session.id),
            ),
          )
        await ctx.redis.setCache(cacheKey, count, 1800)
        return count
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  byFilter: protectedProcedure
    .input(
      z.object({
        filter: z.enum(["all", "unread", "starred", "readLater"]),
        feedId: z.string().optional(),
        page: z.number().default(1),
        perPage: z.number().default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const cacheKey = `feed:articles:filter:${input.filter}:feed:${input.feedId ?? "all"}:page:${input.page}:per:${input.perPage}:user:${ctx.session.id}`
        const cached = await ctx.redis.getCache<SelectArticle[]>(cacheKey)
        if (cached) {
          return cached
        }

        const conditions = [eq(articleTable.userId, ctx.session.id)]

        if (input.feedId) {
          conditions.push(eq(articleTable.feedId, input.feedId))
        }

        if (input.filter === "unread") {
          conditions.push(eq(articleTable.isRead, false))
        } else if (input.filter === "starred") {
          conditions.push(eq(articleTable.isStarred, true))
        } else if (input.filter === "readLater") {
          conditions.push(eq(articleTable.isReadLater, true))
        }

        const data = await ctx.db.query.articleTable.findMany({
          where: and(...conditions),
          offset: (input.page - 1) * input.perPage,
          limit: input.perPage,
          orderBy: desc(articleTable.pubDate),
          with: {
            feed: {
              columns: {
                title: true,
                imageUrl: true,
              },
            },
          },
        })

        await ctx.redis.setCache(cacheKey, data, 1800)
        return data
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  updateReadStatus: protectedProcedure
    .input(z.object({ id: z.string(), isRead: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const updatedArray = await ctx.db
          .update(articleTable)
          .set({ isRead: input.isRead, updatedAt: new Date() })
          .where(
            and(
              eq(articleTable.id, input.id),
              eq(articleTable.userId, ctx.session.id),
            ),
          )
          .returning()
        const updated = updatedArray[0]

        await ctx.redis.deleteCache(
          `feed:article:${input.id}:user:${ctx.session.id}`,
        )
        await ctx.redis.invalidatePattern(
          `feed:articles:*:user:${ctx.session.id}`,
        )

        return updated
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  updateStarred: protectedProcedure
    .input(z.object({ id: z.string(), isStarred: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const updatedArray = await ctx.db
          .update(articleTable)
          .set({ isStarred: input.isStarred, updatedAt: new Date() })
          .where(
            and(
              eq(articleTable.id, input.id),
              eq(articleTable.userId, ctx.session.id),
            ),
          )
          .returning()
        const updated = updatedArray[0]

        await ctx.redis.deleteCache(
          `feed:article:${input.id}:user:${ctx.session.id}`,
        )
        await ctx.redis.invalidatePattern(
          `feed:articles:*:user:${ctx.session.id}`,
        )

        return updated
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  updateReadLater: protectedProcedure
    .input(z.object({ id: z.string(), isReadLater: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const updatedArray = await ctx.db
          .update(articleTable)
          .set({ isReadLater: input.isReadLater, updatedAt: new Date() })
          .where(
            and(
              eq(articleTable.id, input.id),
              eq(articleTable.userId, ctx.session.id),
            ),
          )
          .returning()
        const updated = updatedArray[0]

        await ctx.redis.deleteCache(
          `feed:article:${input.id}:user:${ctx.session.id}`,
        )
        await ctx.redis.invalidatePattern(
          `feed:articles:*:user:${ctx.session.id}`,
        )

        return updated
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  markAllRead: protectedProcedure
    .input(z.object({ feedId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const conditions = [eq(articleTable.userId, ctx.session.id)]

        if (input.feedId) {
          conditions.push(eq(articleTable.feedId, input.feedId))
        }

        await ctx.db
          .update(articleTable)
          .set({ isRead: true, updatedAt: new Date() })
          .where(and(...conditions))

        await ctx.redis.invalidatePattern(
          `feed:articles:*:user:${ctx.session.id}`,
        )
        await ctx.redis.invalidatePattern(
          `feed:article:*:user:${ctx.session.id}`,
        )

        return { success: true }
      } catch (error) {
        handleTRPCError(error)
      }
    }),
})
