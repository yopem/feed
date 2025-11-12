import { TRPCError, type TRPCRouterRecord } from "@trpc/server"
import { and, eq } from "drizzle-orm"
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
              eq(feedTable.status, "published"),
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
                eq(feedTable.status, "published"),
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
            eq(feedTable.status, "published"),
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

  /**
   * Soft-deletes a feed by updating its status to 'deleted'
   *
   * This operation does not permanently remove the feed from the database.
   * Instead, it marks the feed as deleted and cascades the deletion to all
   * associated articles. Deleted feeds and articles are filtered from all queries.
   *
   * @param input - Feed ID to delete
   * @returns Success status
   * @throws TRPCError if feed not found or user lacks permission
   */
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const { eq, and } = await import("drizzle-orm")

        const existingFeed = await ctx.db.query.feedTable.findFirst({
          where: and(
            eq(feedTable.id, input),
            eq(feedTable.userId, ctx.session.id),
            eq(feedTable.status, "published"),
          ),
        })

        if (!existingFeed) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Feed not found.",
          })
        }

        await ctx.db
          .update(feedTable)
          .set({ status: "deleted", updatedAt: new Date() })
          .where(eq(feedTable.id, input))

        await ctx.db
          .update(articleTable)
          .set({ status: "deleted", updatedAt: new Date() })
          .where(eq(articleTable.feedId, input))

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
          where: (feedTable, { eq, and }) =>
            and(
              eq(feedTable.userId, ctx.session.id),
              eq(feedTable.status, "published"),
            ),
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
        const filteredData = data.map((feed) => ({
          ...feed,
          tags: feed.tags.filter((ft) => ft.tag.status === "published"),
        }))
        if (filteredData.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No feeds found for the user.",
          })
        }
        await ctx.redis.setCache(cacheKey, filteredData, 1800)
        return filteredData
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
        where: (feedTable, { eq, and }) =>
          and(eq(feedTable.id, input), eq(feedTable.status, "published")),
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
      const filteredData = {
        ...data,
        tags: data.tags.filter((ft) => ft.tag.status === "published"),
      }
      await ctx.redis.setCache(cacheKey, filteredData, 1800)
      return filteredData
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
          eq(feedTable.status, "published"),
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
      const filteredData = {
        ...data,
        tags: data.tags.filter((ft) => ft.tag.status === "published"),
      }
      await ctx.redis.setCache(cacheKey, filteredData, 1800)
      return filteredData
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
      const { eq, sql, and } = await import("drizzle-orm")

      const stats = await db
        .select({
          feedId: articleTable.feedId,
          totalCount: sql<number>`COUNT(*)::int`,
          unreadCount: sql<number>`COUNT(*) FILTER (WHERE ${articleTable.isRead} = false)::int`,
          starredCount: sql<number>`COUNT(*) FILTER (WHERE ${articleTable.isStarred} = true)::int`,
          readLaterCount: sql<number>`COUNT(*) FILTER (WHERE ${articleTable.isReadLater} = true)::int`,
        })
        .from(articleTable)
        .where(
          and(
            eq(articleTable.userId, ctx.session.id),
            eq(articleTable.status, "published"),
          ),
        )
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
            eq(feedTable.status, "published"),
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
              eq(tagTable.status, "published"),
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
            eq(feedTable.status, "published"),
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
            eq(feedTable.status, "published"),
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
          where: (articleTable, { eq, and }) =>
            and(
              eq(articleTable.feedId, input),
              eq(articleTable.status, "published"),
            ),
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

  /**
   * Enable bulk sharing for all articles in a feed
   *
   * Sets isBulkShared flag on the feed, which makes all articles
   * in that feed publicly accessible via their share slugs. Generates
   * share slugs for articles that don't have them yet.
   *
   * @param feedId - Feed ID
   * @param expiresAt - Optional expiration date for bulk sharing
   * @returns Success status and count of articles enabled for sharing
   */
  bulkShare: protectedProcedure
    .input(
      z.object({
        feedId: z.string(),
        expiresAt: z.date().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const existingFeed = await ctx.db.query.feedTable.findFirst({
          where: and(
            eq(feedTable.id, input.feedId),
            eq(feedTable.userId, ctx.session.id),
            eq(feedTable.status, "published"),
          ),
        })

        if (!existingFeed) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Feed not found.",
          })
        }

        await ctx.db
          .update(feedTable)
          .set({
            isBulkShared: true,
            bulkShareExpiresAt: input.expiresAt,
            updatedAt: new Date(),
          })
          .where(eq(feedTable.id, input.feedId))

        const articles = await ctx.db.query.articleTable.findMany({
          where: and(
            eq(articleTable.feedId, input.feedId),
            eq(articleTable.status, "published"),
          ),
        })

        let enabledCount = 0
        for (const article of articles) {
          let shareSlug = article.shareSlug
          if (!shareSlug) {
            const { createCustomId } = await import("@/lib/utils/custom-id")
            shareSlug = createCustomId().slice(0, 12)

            let attempts = 0
            while (attempts < 5) {
              const existing = await ctx.db.query.articleTable.findFirst({
                where: eq(articleTable.shareSlug, shareSlug),
              })
              if (!existing) break
              shareSlug = createCustomId().slice(0, 12)
              attempts++
            }
          }

          await ctx.db
            .update(articleTable)
            .set({
              isPubliclyShared: true,
              shareSlug,
              updatedAt: new Date(),
            })
            .where(eq(articleTable.id, article.id))

          enabledCount++
        }

        await ctx.redis.invalidatePattern(`feed:*:user:${ctx.session.id}`)
        await ctx.redis.invalidatePattern(`article:*:user:${ctx.session.id}`)

        return { success: true, enabledCount }
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  /**
   * Disable bulk sharing for a feed
   *
   * Unsets isBulkShared flag on the feed and disables public sharing
   * for all articles in that feed. Share slugs are preserved but
   * articles become inaccessible publicly.
   *
   * @param feedId - Feed ID
   * @returns Success status and count of articles disabled
   */
  bulkUnshare: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const existingFeed = await ctx.db.query.feedTable.findFirst({
          where: and(
            eq(feedTable.id, input),
            eq(feedTable.userId, ctx.session.id),
            eq(feedTable.status, "published"),
          ),
        })

        if (!existingFeed) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Feed not found.",
          })
        }

        await ctx.db
          .update(feedTable)
          .set({
            isBulkShared: false,
            bulkShareExpiresAt: null,
            updatedAt: new Date(),
          })
          .where(eq(feedTable.id, input))

        const result = await ctx.db
          .update(articleTable)
          .set({
            isPubliclyShared: false,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(articleTable.feedId, input),
              eq(articleTable.status, "published"),
            ),
          )
          .returning()

        await ctx.redis.invalidatePattern(`feed:*:user:${ctx.session.id}`)
        await ctx.redis.invalidatePattern(`article:*:user:${ctx.session.id}`)

        return { success: true, disabledCount: result.length }
      } catch (error) {
        handleTRPCError(error)
      }
    }),
} satisfies TRPCRouterRecord
