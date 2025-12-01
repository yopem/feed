import { TRPCError } from "@trpc/server"
import { and, count, desc, eq, gte, ilike, lt, or } from "drizzle-orm"
import z from "zod"

import { handleTRPCError } from "@/lib/api/error"
import { createTRPCRouter, protectedProcedure } from "@/lib/api/trpc"
import {
  articleTable,
  feedTable,
  type SelectArticle,
  type SelectFeed,
} from "@/lib/db/schema"

type ArticleWithFeed = SelectArticle & {
  feed: Pick<SelectFeed, "title" | "slug" | "imageUrl">
}

/**
 * Article management router providing CRUD operations and filtering
 * for articles with caching support via Redis
 */
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
          where: (articleTable, { eq, and }) =>
            and(
              eq(articleTable.userId, ctx.session.id),
              eq(articleTable.status, "published"),
            ),
          offset: (input.page - 1) * input.perPage,
          limit: input.perPage,
          orderBy: (articles, { desc }) => [desc(articles.createdAt)],
          with: {
            feed: {
              columns: {
                title: true,
                slug: true,
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
      const cached = await ctx.redis.getCache<ArticleWithFeed>(cacheKey)
      if (cached) {
        return cached
      }
      const data = await ctx.db.query.articleTable.findFirst({
        where: (articleTable, { eq, and }) =>
          and(eq(articleTable.id, input), eq(articleTable.status, "published")),
        with: {
          feed: {
            columns: {
              title: true,
              slug: true,
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

  byFeedAndArticleSlug: protectedProcedure
    .input(
      z.object({
        feedSlug: z.string(),
        articleSlug: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const cacheKey = `feed:article:feed:${input.feedSlug}:article:${input.articleSlug}:user:${ctx.session.id}`
        const cached = await ctx.redis.getCache<ArticleWithFeed>(cacheKey)
        if (cached) {
          return cached
        }

        const feed = await ctx.db.query.feedTable.findFirst({
          where: and(
            eq(feedTable.slug, input.feedSlug),
            eq(feedTable.userId, ctx.session.id),
            eq(feedTable.status, "published"),
          ),
        })

        if (!feed) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Feed not found.",
          })
        }

        const data = await ctx.db.query.articleTable.findFirst({
          where: and(
            eq(articleTable.slug, input.articleSlug),
            eq(articleTable.feedId, feed.id),
            eq(articleTable.status, "published"),
          ),
          with: {
            feed: {
              columns: {
                title: true,
                imageUrl: true,
                slug: true,
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
              eq(articleTable.status, "published"),
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
        filter: z.enum([
          "all",
          "unread",
          "starred",
          "readLater",
          "today",
          "recentlyRead",
        ]),
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

        const conditions = [
          eq(articleTable.userId, ctx.session.id),
          eq(articleTable.status, "published"),
        ]

        if (input.feedId) {
          conditions.push(eq(articleTable.feedId, input.feedId))
        }

        if (input.filter === "unread") {
          conditions.push(eq(articleTable.isRead, false))
        } else if (input.filter === "starred") {
          conditions.push(eq(articleTable.isFavorited, true))
        } else if (input.filter === "readLater") {
          conditions.push(eq(articleTable.isReadLater, true))
        } else if (input.filter === "today") {
          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
          conditions.push(gte(articleTable.pubDate, yesterday))
        } else if (input.filter === "recentlyRead") {
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          conditions.push(eq(articleTable.isRead, true))
          conditions.push(gte(articleTable.updatedAt, sevenDaysAgo))
        }

        const data = await ctx.db.query.articleTable.findMany({
          where: and(...conditions),
          offset: (input.page - 1) * input.perPage,
          limit: input.perPage,
          orderBy: (articles, { desc }) => [
            desc(articles.pubDate),
            desc(articles.id),
          ],
          with: {
            feed: {
              columns: {
                title: true,
                slug: true,
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

        await ctx.redis.invalidatePattern(
          `feed:article:*:user:${ctx.session.id}`,
        )
        await ctx.redis.invalidatePattern(
          `feed:articles:*:user:${ctx.session.id}`,
        )
        await ctx.redis.deleteCache(`feed:statistics:user:${ctx.session.id}`)

        return updated
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  /**
   * Updates the favorited status of an article
   *
   * Allows users to mark or unmark articles as favorited for quick access
   * and filtering. Favorited articles can be filtered in the article list view.
   * This operation invalidates relevant caches to keep the UI in sync.
   *
   * @param input - Article ID and desired favorited state
   * @returns Updated article data
   * @throws TRPCError if article update fails
   */
  updateFavorited: protectedProcedure
    .input(z.object({ id: z.string(), isFavorited: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const updatedArray = await ctx.db
          .update(articleTable)
          .set({ isFavorited: input.isFavorited, updatedAt: new Date() })
          .where(
            and(
              eq(articleTable.id, input.id),
              eq(articleTable.userId, ctx.session.id),
            ),
          )
          .returning()
        const updated = updatedArray[0]

        await ctx.redis.invalidatePattern(
          `feed:article:*:user:${ctx.session.id}`,
        )
        await ctx.redis.invalidatePattern(
          `feed:articles:*:user:${ctx.session.id}`,
        )
        await ctx.redis.deleteCache(`feed:statistics:user:${ctx.session.id}`)

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

        await ctx.redis.invalidatePattern(
          `feed:article:*:user:${ctx.session.id}`,
        )
        await ctx.redis.invalidatePattern(
          `feed:articles:*:user:${ctx.session.id}`,
        )
        await ctx.redis.deleteCache(`feed:statistics:user:${ctx.session.id}`)

        return updated
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  markAllRead: protectedProcedure
    .input(z.object({ feedId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const conditions = [
          eq(articleTable.userId, ctx.session.id),
          eq(articleTable.status, "published"),
        ]

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
        await ctx.redis.deleteCache(`feed:statistics:user:${ctx.session.id}`)

        return { success: true }
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  byFilterInfinite: protectedProcedure
    .input(
      z.object({
        filter: z
          .enum([
            "all",
            "unread",
            "starred",
            "readLater",
            "today",
            "recentlyRead",
          ])
          .default("all"),
        feedId: z.string().optional(),
        limit: z.number().default(50),
        cursor: z.string().nullable().optional(), // ISO date string
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        let cursorDate: Date | undefined
        if (input.cursor) {
          cursorDate = new Date(input.cursor)

          if (isNaN(cursorDate.getTime())) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid cursor date format",
            })
          }
        }

        const conditions = [
          eq(articleTable.userId, ctx.session.id),
          eq(articleTable.status, "published"),
        ]

        if (input.feedId) {
          conditions.push(eq(articleTable.feedId, input.feedId))
        }

        if (input.filter === "unread") {
          conditions.push(eq(articleTable.isRead, false))
        } else if (input.filter === "starred") {
          conditions.push(eq(articleTable.isFavorited, true))
        } else if (input.filter === "readLater") {
          conditions.push(eq(articleTable.isReadLater, true))
        } else if (input.filter === "today") {
          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
          conditions.push(gte(articleTable.pubDate, yesterday))
        } else if (input.filter === "recentlyRead") {
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          conditions.push(eq(articleTable.isRead, true))
          conditions.push(gte(articleTable.updatedAt, sevenDaysAgo))
        }

        if (cursorDate) {
          conditions.push(lt(articleTable.pubDate, cursorDate))
        }

        const articles = await ctx.db.query.articleTable.findMany({
          where: and(...conditions),
          limit: input.limit + 1,
          orderBy: (articles, { desc }) => [
            desc(articles.pubDate),
            desc(articles.id),
          ],
          with: {
            feed: {
              columns: {
                title: true,
                slug: true,
                imageUrl: true,
              },
            },
          },
        })

        const hasMore = articles.length > input.limit
        const items = hasMore ? articles.slice(0, -1) : articles

        const lastItem = items[items.length - 1]
        const nextCursor = hasMore ? lastItem.pubDate.toISOString() : undefined

        return {
          articles: items,
          nextCursor,
        }
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  /**
   * Public endpoint to fetch article by username and share slug
   *
   * Fetches a publicly shared article using username and slug combination.
   * This allows multiple users to use the same slug without conflicts.
   * Checks expiration and returns password protection status.
   *
   * @param username - The article owner's username
   * @param slug - Share slug
   * @returns Publicly shared article with feed information
   */
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(2),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const cacheKey = `search:query:${input.query}:limit:${input.limit}:user:${ctx.session.id}`
        const cached = await ctx.redis.getCache<{
          articles: ArticleWithFeed[]
          feeds: SelectFeed[]
        }>(cacheKey)
        if (cached) {
          return cached
        }

        const searchPattern = `%${input.query}%`

        const articles = await ctx.db.query.articleTable.findMany({
          where: and(
            eq(articleTable.userId, ctx.session.id),
            eq(articleTable.status, "published"),
            or(
              ilike(articleTable.title, searchPattern),
              ilike(articleTable.description, searchPattern),
            ),
          ),
          limit: input.limit,
          orderBy: [desc(articleTable.pubDate)],
          with: {
            feed: {
              columns: {
                title: true,
                slug: true,
                imageUrl: true,
              },
            },
          },
        })

        const feeds = await ctx.db.query.feedTable.findMany({
          where: and(
            eq(feedTable.userId, ctx.session.id),
            eq(feedTable.status, "published"),
            ilike(feedTable.title, searchPattern),
          ),
          limit: Math.min(10, input.limit),
          orderBy: [desc(feedTable.createdAt)],
        })

        const result = {
          articles: articles as ArticleWithFeed[],
          feeds,
        }

        await ctx.redis.setCache(cacheKey, result, 300)
        return result
      } catch (error) {
        handleTRPCError(error)
      }
    }),
})
