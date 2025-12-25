import { ORPCError } from "@orpc/server"
import { and, count, desc, eq, gte, ilike, lt, or } from "drizzle-orm"
import z from "zod"

import { handleORPCError } from "@/lib/api/error"
import { protectedProcedure } from "@/lib/api/orpc"
import {
  articleTable,
  feedTable,
  type SelectArticle,
  type SelectFeed,
} from "@/lib/db/schema"

type ArticleWithFeed = SelectArticle & {
  feed: Pick<SelectFeed, "title" | "slug" | "imageUrl">
}

export const articleRouter = {
  all: protectedProcedure
    .input(z.object({ page: z.number(), perPage: z.number() }))
    .handler(async ({ context, input }) => {
      try {
        const cacheKey = `feed:articles:page:${input.page}:per:${input.perPage}:user:${context.session.id}`
        const cached = await context.redis.getCache<SelectArticle[]>(cacheKey)
        if (cached) {
          return cached
        }
        const data = await context.db.query.articleTable.findMany({
          where: (articleTable, { eq, and }) =>
            and(
              eq(articleTable.userId, context.session.id),
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
          throw new ORPCError("NOT_FOUND", {
            message: "No articles found for the user.",
          })
        }
        await context.redis.setCache(cacheKey, data, 1800)
        return data
      } catch (error) {
        handleORPCError(error)
      }
    }),

  byId: protectedProcedure
    .input(z.string())
    .handler(async ({ context, input }) => {
      try {
        const cacheKey = `feed:article:${input}:user:${context.session.id}`
        const cached = await context.redis.getCache<ArticleWithFeed>(cacheKey)
        if (cached) {
          return cached
        }
        const data = await context.db.query.articleTable.findFirst({
          where: (articleTable, { eq, and }) =>
            and(
              eq(articleTable.id, input),
              eq(articleTable.status, "published"),
            ),
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
          throw new ORPCError("NOT_FOUND", {
            message: "Article not found.",
          })
        }
        await context.redis.setCache(cacheKey, data, 1800)
        return data
      } catch (error) {
        handleORPCError(error)
      }
    }),

  byFeedAndArticleSlug: protectedProcedure
    .input(
      z.object({
        feedSlug: z.string(),
        articleSlug: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      try {
        const cacheKey = `feed:article:feed:${input.feedSlug}:article:${input.articleSlug}:user:${context.session.id}`
        const cached = await context.redis.getCache<ArticleWithFeed>(cacheKey)
        if (cached) {
          return cached
        }

        const feed = await context.db.query.feedTable.findFirst({
          where: and(
            eq(feedTable.slug, input.feedSlug),
            eq(feedTable.userId, context.session.id),
            eq(feedTable.status, "published"),
          ),
        })

        if (!feed) {
          throw new ORPCError("NOT_FOUND", {
            message: "Feed not found.",
          })
        }

        const data = await context.db.query.articleTable.findFirst({
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
          throw new ORPCError("NOT_FOUND", {
            message: "Article not found.",
          })
        }

        await context.redis.setCache(cacheKey, data, 1800)
        return data
      } catch (error) {
        handleORPCError(error)
      }
    }),

  countByFeedId: protectedProcedure
    .input(z.string())
    .handler(async ({ context, input }) => {
      try {
        const cacheKey = `feed:article:count:feed:${input}:user:${context.session.id}`
        const cached = await context.redis.getCache<number>(cacheKey)
        if (cached) {
          return cached
        }
        await context.db
          .select({ count: count() })
          .from(articleTable)
          .where(
            and(
              eq(articleTable.feedId, input),
              eq(articleTable.userId, context.session.id),
              eq(articleTable.status, "published"),
            ),
          )
        await context.redis.setCache(cacheKey, count, 1800)
        return count
      } catch (error) {
        handleORPCError(error)
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
    .handler(async ({ context, input }) => {
      try {
        const cacheKey = `feed:articles:filter:${input.filter}:feed:${input.feedId ?? "all"}:page:${input.page}:per:${input.perPage}:user:${context.session.id}`
        const cached = await context.redis.getCache<SelectArticle[]>(cacheKey)
        if (cached) {
          return cached
        }

        const conditions = [
          eq(articleTable.userId, context.session.id),
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

        const data = await context.db.query.articleTable.findMany({
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

        await context.redis.setCache(cacheKey, data, 1800)
        return data
      } catch (error) {
        handleORPCError(error)
      }
    }),

  updateReadStatus: protectedProcedure
    .input(z.object({ id: z.string(), isRead: z.boolean() }))
    .handler(async ({ context, input }) => {
      try {
        const updatedArray = await context.db
          .update(articleTable)
          .set({ isRead: input.isRead, updatedAt: new Date() })
          .where(
            and(
              eq(articleTable.id, input.id),
              eq(articleTable.userId, context.session.id),
            ),
          )
          .returning()
        const updated = updatedArray[0]

        await context.redis.invalidatePattern(
          `feed:article:*:user:${context.session.id}`,
        )
        await context.redis.invalidatePattern(
          `feed:articles:*:user:${context.session.id}`,
        )
        await context.redis.deleteCache(
          `feed:statistics:user:${context.session.id}`,
        )

        return updated
      } catch (error) {
        handleORPCError(error)
      }
    }),

  updateFavorited: protectedProcedure
    .input(z.object({ id: z.string(), isFavorited: z.boolean() }))
    .handler(async ({ context, input }) => {
      try {
        const updatedArray = await context.db
          .update(articleTable)
          .set({ isFavorited: input.isFavorited, updatedAt: new Date() })
          .where(
            and(
              eq(articleTable.id, input.id),
              eq(articleTable.userId, context.session.id),
            ),
          )
          .returning()
        const updated = updatedArray[0]

        await context.redis.invalidatePattern(
          `feed:article:*:user:${context.session.id}`,
        )
        await context.redis.invalidatePattern(
          `feed:articles:*:user:${context.session.id}`,
        )
        await context.redis.deleteCache(
          `feed:statistics:user:${context.session.id}`,
        )

        return updated
      } catch (error) {
        handleORPCError(error)
      }
    }),

  updateReadLater: protectedProcedure
    .input(z.object({ id: z.string(), isReadLater: z.boolean() }))
    .handler(async ({ context, input }) => {
      try {
        const updatedArray = await context.db
          .update(articleTable)
          .set({ isReadLater: input.isReadLater, updatedAt: new Date() })
          .where(
            and(
              eq(articleTable.id, input.id),
              eq(articleTable.userId, context.session.id),
            ),
          )
          .returning()
        const updated = updatedArray[0]

        await context.redis.invalidatePattern(
          `feed:article:*:user:${context.session.id}`,
        )
        await context.redis.invalidatePattern(
          `feed:articles:*:user:${context.session.id}`,
        )
        await context.redis.deleteCache(
          `feed:statistics:user:${context.session.id}`,
        )

        return updated
      } catch (error) {
        handleORPCError(error)
      }
    }),

  markAllRead: protectedProcedure
    .input(z.object({ feedId: z.string().optional() }))
    .handler(async ({ context, input }) => {
      try {
        const conditions = [
          eq(articleTable.userId, context.session.id),
          eq(articleTable.status, "published"),
        ]

        if (input.feedId) {
          conditions.push(eq(articleTable.feedId, input.feedId))
        }

        await context.db
          .update(articleTable)
          .set({ isRead: true, updatedAt: new Date() })
          .where(and(...conditions))

        await context.redis.invalidatePattern(
          `feed:articles:*:user:${context.session.id}`,
        )
        await context.redis.invalidatePattern(
          `feed:article:*:user:${context.session.id}`,
        )
        await context.redis.deleteCache(
          `feed:statistics:user:${context.session.id}`,
        )

        return { success: true }
      } catch (error) {
        handleORPCError(error)
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
    .handler(async ({ context, input }) => {
      try {
        let cursorDate: Date | undefined
        if (input.cursor) {
          cursorDate = new Date(input.cursor)

          if (isNaN(cursorDate.getTime())) {
            throw new ORPCError("BAD_REQUEST", {
              message: "Invalid cursor date format",
            })
          }
        }

        const conditions = [
          eq(articleTable.userId, context.session.id),
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

        const articles = await context.db.query.articleTable.findMany({
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
        handleORPCError(error)
      }
    }),

  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(2),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .handler(async ({ context, input }) => {
      try {
        const cacheKey = `search:query:${input.query}:limit:${input.limit}:user:${context.session.id}`
        const cached = await context.redis.getCache<{
          articles: ArticleWithFeed[]
          feeds: SelectFeed[]
        }>(cacheKey)
        if (cached) {
          return cached
        }

        const searchPattern = `%${input.query}%`

        const articles = await context.db.query.articleTable.findMany({
          where: and(
            eq(articleTable.userId, context.session.id),
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

        const feeds = await context.db.query.feedTable.findMany({
          where: and(
            eq(feedTable.userId, context.session.id),
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

        await context.redis.setCache(cacheKey, result, 300)
        return result
      } catch (error) {
        handleORPCError(error)
      }
    }),
}
