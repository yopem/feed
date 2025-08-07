import { TRPCError } from "@trpc/server"
import { and, count, eq } from "drizzle-orm"
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
})
