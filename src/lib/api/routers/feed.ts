import { TRPCError, type TRPCRouterRecord } from "@trpc/server"
import z from "zod"

import { handleTRPCError } from "@/lib/api/error"
import { protectedProcedure } from "@/lib/api/trpc"
import { articleTable, feedTable, type SelectFeed } from "@/lib/db/schema"
import { parseFeed } from "@/lib/utils/scraping"

export const feedRouter = {
  create: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const feedData = await parseFeed(input)
        const [feed] = await ctx.db
          .insert(feedTable)
          .values({
            title: feedData.title,
            description: feedData.description || "",
            url: input,
            imageUrl: feedData.imageUrl,
            userId: ctx.session.id,
          })
          .returning()
        if (feedData.articles.length > 0) {
          const articlesToInsert = feedData.articles.map((article) => ({
            title: article.title,
            description: article.description,
            content: article.content,
            link: article.link,
            imageUrl: article.imageUrl,
            source: article.source,
            pubDate: new Date(article.pubDate),
            userId: ctx.session.id,
            feedId: feed.id,
            isRead: false,
            isReadLater: false,
            isStarred: false,
          }))
          await ctx.db.insert(articleTable).values(articlesToInsert)
        }
        return feed
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  all: protectedProcedure
    .input(z.object({ page: z.number(), perPage: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const cacheKey = `feed:feeds:page:${input.page}:per:${input.perPage}:user:${ctx.session.id}`
        const cached = await ctx.redis.getCache<SelectFeed[]>(cacheKey)
        if (cached) {
          return cached
        }
        const data = await ctx.db.query.feedTable.findMany({
          where: (feedTable, { eq }) => eq(feedTable.userId, ctx.session.id),
          offset: (input.page - 1) * input.perPage,
          limit: input.perPage,
          orderBy: (feeds, { desc }) => [desc(feeds.createdAt)],
          with: {
            tags: {
              with: {
                tag: true,
              },
            },
          },
        })
        if (data.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No feeds found for the user.",
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
      const cacheKey = `feed:feed:${input}:user:${ctx.session.id}`
      const cached = await ctx.redis.getCache<SelectFeed>(cacheKey)
      if (cached) {
        return cached
      }
      const data = await ctx.db.query.feedTable.findFirst({
        where: (feedTable, { eq }) => eq(feedTable.id, input),
        with: {
          tags: {
            with: {
              tag: true,
            },
          },
        },
      })
      if (!data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feed not found.",
        })
      }
      await ctx.redis.setCache(cacheKey, data, 1800)
      return data
    } catch (error) {
      handleTRPCError(error)
    }
  }),
} satisfies TRPCRouterRecord
