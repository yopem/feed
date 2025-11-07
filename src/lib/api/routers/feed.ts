import { TRPCError, type TRPCRouterRecord } from "@trpc/server"
import z from "zod"

import { handleTRPCError } from "@/lib/api/error"
import { protectedProcedure } from "@/lib/api/trpc"
import {
  articleTable,
  feedTable,
  feedTagsTable,
  tagTable,
  type SelectFeed,
} from "@/lib/db/schema"
import { parseFeed } from "@/lib/utils/scraping"
import { slugify } from "@/lib/utils/slug"

/**
 * Feed management router providing operations for RSS/Atom feed subscriptions
 * including parsing, refreshing, and tag assignment
 */
export const feedRouter = {
  create: protectedProcedure
    .input(
      z.string().url("Please provide a valid URL").min(1, "URL is required"),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const trimmedInput = input.trim()
        if (!trimmedInput) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Feed URL cannot be empty.",
          })
        }

        const existingFeed = await ctx.db.query.feedTable.findFirst({
          where: (feedTable, { eq, and }) =>
            and(
              eq(feedTable.userId, ctx.session.id),
              eq(feedTable.url, trimmedInput),
            ),
        })

        if (existingFeed) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "You have already subscribed to this feed.",
          })
        }

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(
              new Error(
                "Feed parsing timed out. The feed may be too slow to respond.",
              ),
            )
          }, 15000)
        })

        const feedData = await Promise.race([
          parseFeed(trimmedInput),
          timeoutPromise,
        ])

        const baseSlug = slugify(feedData.title)
        let slug = baseSlug
        let suffix = 1

        while (true) {
          const existingSlug = await ctx.db.query.feedTable.findFirst({
            where: (feedTable, { eq, and }) =>
              and(
                eq(feedTable.userId, ctx.session.id),
                eq(feedTable.slug, slug),
              ),
          })

          if (!existingSlug) break
          slug = `${baseSlug}-${suffix}`
          suffix++
        }

        const [feed] = await ctx.db
          .insert(feedTable)
          .values({
            title: feedData.title,
            description: feedData.description,
            url: trimmedInput,
            slug,
            imageUrl: feedData.imageUrl,
            userId: ctx.session.id,
          })
          .returning()
        if (feedData.articles.length > 0) {
          const articlesToInsert = feedData.articles.map((article) => {
            const articleSlug = slugify(article.title)
            return {
              title: article.title,
              slug: articleSlug,
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
            }
          })

          const slugCounts = new Map<string, number>()
          const finalArticles = articlesToInsert.map((article) => {
            let finalSlug = article.slug
            const count = slugCounts.get(article.slug) ?? 0

            if (count > 0) {
              finalSlug = `${article.slug}-${count}`
            }

            slugCounts.set(article.slug, count + 1)

            return {
              ...article,
              slug: finalSlug,
            }
          })

          await ctx.db.insert(articleTable).values(finalArticles)
        }

        await ctx.redis.invalidatePattern(`feed:*:user:${ctx.session.id}`)

        return feed
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message.includes("feed") ||
            error.message.includes("URL") ||
            error.message.includes("timed out") ||
            error.message.includes("fetch")
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: error.message,
            })
          }
        }
        handleTRPCError(error)
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { eq, and } = await import("drizzle-orm")

        const existingFeed = await ctx.db.query.feedTable.findFirst({
          where: and(
            eq(feedTable.id, input.id),
            eq(feedTable.userId, ctx.session.id),
          ),
        })

        if (!existingFeed) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Feed not found.",
          })
        }

        const [updatedFeed] = await ctx.db
          .update(feedTable)
          .set({
            title: input.title ?? existingFeed.title,
            description: input.description ?? existingFeed.description,
            updatedAt: new Date(),
          })
          .where(eq(feedTable.id, input.id))
          .returning()

        await ctx.redis.invalidatePattern(`feed:*:user:${ctx.session.id}`)

        return updatedFeed
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const { eq, and } = await import("drizzle-orm")

        const existingFeed = await ctx.db.query.feedTable.findFirst({
          where: and(
            eq(feedTable.id, input),
            eq(feedTable.userId, ctx.session.id),
          ),
        })

        if (!existingFeed) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Feed not found.",
          })
        }

        await ctx.db
          .delete(feedTagsTable)
          .where(eq(feedTagsTable.feedId, input))

        await ctx.db.delete(articleTable).where(eq(articleTable.feedId, input))

        await ctx.db.delete(feedTable).where(eq(feedTable.id, input))

        await ctx.redis.invalidatePattern(`feed:*:user:${ctx.session.id}`)
        await ctx.redis.invalidatePattern(`article:*:user:${ctx.session.id}`)

        return { success: true }
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

  bySlug: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    try {
      const cacheKey = `feed:feed:slug:${input}:user:${ctx.session.id}`
      const cached = await ctx.redis.getCache<SelectFeed>(cacheKey)
      if (cached) {
        return cached
      }
      const { eq, and } = await import("drizzle-orm")
      const data = await ctx.db.query.feedTable.findFirst({
        where: and(
          eq(feedTable.slug, input),
          eq(feedTable.userId, ctx.session.id),
        ),
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

  statistics: protectedProcedure.query(async ({ ctx }) => {
    try {
      const cacheKey = `feed:statistics:user:${ctx.session.id}`
      const cached = await ctx.redis.getCache<
        {
          feedId: string
          totalCount: number
          unreadCount: number
          starredCount: number
          readLaterCount: number
        }[]
      >(cacheKey)
      if (cached) {
        return cached
      }

      const { db } = await import("@/lib/db")
      const { eq, sql } = await import("drizzle-orm")

      const stats = await db
        .select({
          feedId: articleTable.feedId,
          totalCount: sql<number>`COUNT(*)::int`,
          unreadCount: sql<number>`COUNT(*) FILTER (WHERE ${articleTable.isRead} = false)::int`,
          starredCount: sql<number>`COUNT(*) FILTER (WHERE ${articleTable.isStarred} = true)::int`,
          readLaterCount: sql<number>`COUNT(*) FILTER (WHERE ${articleTable.isReadLater} = true)::int`,
        })
        .from(articleTable)
        .where(eq(articleTable.userId, ctx.session.id))
        .groupBy(articleTable.feedId)

      await ctx.redis.setCache(cacheKey, stats, 1800)
      return stats
    } catch (error) {
      handleTRPCError(error)
    }
  }),

  assignTags: protectedProcedure
    .input(
      z.object({
        feedId: z.string(),
        tagIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { eq, and, inArray } = await import("drizzle-orm")

        const existingFeed = await ctx.db.query.feedTable.findFirst({
          where: and(
            eq(feedTable.id, input.feedId),
            eq(feedTable.userId, ctx.session.id),
          ),
        })

        if (!existingFeed) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Feed not found.",
          })
        }

        if (input.tagIds.length > 0) {
          const tags = await ctx.db.query.tagTable.findMany({
            where: and(
              inArray(tagTable.id, input.tagIds),
              eq(tagTable.userId, ctx.session.id),
            ),
          })

          if (tags.length !== input.tagIds.length) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "One or more tags not found.",
            })
          }

          await ctx.db
            .delete(feedTagsTable)
            .where(eq(feedTagsTable.feedId, input.feedId))

          const tagAssignments = input.tagIds.map((tagId) => ({
            feedId: input.feedId,
            tagId,
          }))
          await ctx.db.insert(feedTagsTable).values(tagAssignments)
        } else {
          await ctx.db
            .delete(feedTagsTable)
            .where(eq(feedTagsTable.feedId, input.feedId))
        }

        await ctx.redis.invalidatePattern(`feed:*:user:${ctx.session.id}`)

        return { success: true }
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  unassignTag: protectedProcedure
    .input(
      z.object({
        feedId: z.string(),
        tagId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { eq, and } = await import("drizzle-orm")

        const existingFeed = await ctx.db.query.feedTable.findFirst({
          where: and(
            eq(feedTable.id, input.feedId),
            eq(feedTable.userId, ctx.session.id),
          ),
        })

        if (!existingFeed) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Feed not found.",
          })
        }

        await ctx.db
          .delete(feedTagsTable)
          .where(
            and(
              eq(feedTagsTable.feedId, input.feedId),
              eq(feedTagsTable.tagId, input.tagId),
            ),
          )

        await ctx.redis.invalidatePattern(`feed:*:user:${ctx.session.id}`)

        return { success: true }
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  refresh: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const { eq, and } = await import("drizzle-orm")

        const existingFeed = await ctx.db.query.feedTable.findFirst({
          where: and(
            eq(feedTable.id, input),
            eq(feedTable.userId, ctx.session.id),
          ),
        })

        if (!existingFeed) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Feed not found.",
          })
        }

        const feedData = await parseFeed(existingFeed.url)

        if (feedData.articles.length === 0) {
          return { newArticles: 0 }
        }

        const existingArticles = await ctx.db.query.articleTable.findMany({
          where: eq(articleTable.feedId, input),
          columns: {
            link: true,
          },
        })

        const existingLinks = new Set(existingArticles.map((a) => a.link))

        const newArticles = feedData.articles.filter(
          (article) => !existingLinks.has(article.link),
        )

        if (newArticles.length === 0) {
          return { newArticles: 0 }
        }

        const articlesToInsert = newArticles.map((article) => {
          const articleSlug = slugify(article.title)
          return {
            title: article.title,
            slug: articleSlug,
            description: article.description,
            content: article.content,
            link: article.link,
            imageUrl: article.imageUrl,
            source: article.source,
            pubDate: new Date(article.pubDate),
            userId: ctx.session.id,
            feedId: input,
            isRead: false,
            isReadLater: false,
            isStarred: false,
          }
        })

        const slugCounts = new Map<string, number>()
        const finalArticles = articlesToInsert.map((article) => {
          let finalSlug = article.slug
          const count = slugCounts.get(article.slug) ?? 0

          if (count > 0) {
            finalSlug = `${article.slug}-${count}`
          }

          slugCounts.set(article.slug, count + 1)

          return {
            ...article,
            slug: finalSlug,
          }
        })

        await ctx.db.insert(articleTable).values(finalArticles)

        await ctx.redis.invalidatePattern(`feed:*:user:${ctx.session.id}`)
        await ctx.redis.invalidatePattern(`article:*:user:${ctx.session.id}`)
        await ctx.redis.deleteCache(`feed:statistics:user:${ctx.session.id}`)

        return { newArticles: newArticles.length }
      } catch (error) {
        handleTRPCError(error)
      }
    }),
} satisfies TRPCRouterRecord
