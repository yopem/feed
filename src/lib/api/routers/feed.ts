import { TRPCError, type TRPCRouterRecord } from "@trpc/server"
import { eq } from "drizzle-orm"
import z from "zod"

import { handleTRPCError } from "@/lib/api/error"
import { protectedProcedure, publicProcedure } from "@/lib/api/trpc"
import {
  articleTable,
  feedTable,
  feedTagsTable,
  tagTable,
  userSettingsTable,
  type SelectFeed,
} from "@/lib/db/schema"
import { cronSecret } from "@/lib/env/server"
import { createTokenBucket } from "@/lib/utils/rate-limit"
import {
  generateGoogleNewsTitle,
  isGoogleNewsUrl,
  isRedditUrl,
  normalizeRedditUrl,
  parseFeed,
} from "@/lib/utils/scraping"
import { slugify } from "@/lib/utils/slug"

/**
 * Rate limiter for manual feed refresh operations
 * Allows 1 refresh per 5 minutes (300 seconds) per user
 */
const refreshAllRateLimiter = createTokenBucket<string>(1, 300)

/**
 * Feed management router providing operations for RSS/Atom feed subscriptions
 * including parsing, refreshing, and tag assignment
 */
export const feedRouter = {
  /**
   * Create a new feed subscription from RSS/Atom or Reddit URL
   *
   * Parses the feed, extracts articles, and stores them in the database.
   * Automatically generates a unique slug for the feed. Supports both RSS/Atom
   * feeds and Reddit subreddits. Validates feed URL and checks for duplicates.
   *
   * @param input - Feed URL (RSS/Atom or Reddit subreddit)
   * @returns Created feed with metadata
   * @throws TRPCError if URL is invalid, feed already exists, or parsing fails
   */
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

        const isReddit = isRedditUrl(trimmedInput)
        const isGoogleNews = isGoogleNewsUrl(trimmedInput)
        const feedType = isReddit
          ? "reddit"
          : isGoogleNews
            ? "google_news"
            : "rss"
        const normalizedUrl = isReddit
          ? normalizeRedditUrl(trimmedInput)
          : trimmedInput

        const existingFeed = await ctx.db.query.feedTable.findFirst({
          where: (feedTable, { eq, and }) =>
            and(
              eq(feedTable.userId, ctx.session.id),
              eq(feedTable.url, normalizedUrl),
              eq(feedTable.status, "published"),
            ),
        })

        if (existingFeed) {
          throw new TRPCError({
            code: "CONFLICT",
            message: isReddit
              ? "You have already subscribed to this subreddit."
              : "You have already subscribed to this feed.",
          })
        }

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(
              new Error(
                isReddit
                  ? "Reddit request timed out. Please try again later."
                  : "Feed parsing timed out. The feed may be too slow to respond.",
              ),
            )
          }, 15000)
        })

        const feedData = await Promise.race([
          parseFeed(normalizedUrl, feedType),
          timeoutPromise,
        ])

        const feedTitle = isGoogleNews
          ? generateGoogleNewsTitle(normalizedUrl)
          : feedData.title

        const baseSlug = slugify(feedTitle)
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
            title: feedTitle,
            description: feedData.description,
            url: normalizedUrl,
            slug,
            imageUrl: feedData.imageUrl,
            userId: ctx.session.id,
            feedType,
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
              isFavorited: false,
              redditPostId: article.redditPostId,
              redditPermalink: article.redditPermalink,
              redditSubreddit: article.redditSubreddit,
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

  /**
   * Update feed title and/or description
   *
   * Allows modification of feed metadata without re-parsing the feed.
   * Only the title and description can be updated; URL and other properties
   * remain unchanged. Invalidates feed caches.
   *
   * @param input.id - Feed ID to update
   * @param input.title - New title (optional)
   * @param input.description - New description (optional)
   * @returns Updated feed data
   * @throws TRPCError if feed not found or user lacks permission
   */
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

  /**
   * Toggles the favorited status of a feed
   *
   * Allows users to mark or unmark feeds as favorited for quick access
   * and better organization. Favorited status is stored in the database and
   * persists across sessions.
   *
   * @param input - Feed ID and desired favorited state
   * @returns Updated feed data
   * @throws TRPCError if feed not found or user lacks permission
   */
  toggleFavorited: protectedProcedure
    .input(z.object({ id: z.string(), isFavorited: z.boolean() }))
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
          .set({ isFavorited: input.isFavorited, updatedAt: new Date() })
          .where(eq(feedTable.id, input.id))
          .returning()

        await ctx.redis.invalidatePattern(`feed:*:user:${ctx.session.id}`)

        return updatedFeed
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
          todayCount: number
          recentlyReadCount: number
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
          favoritedCount: sql<number>`COUNT(*) FILTER (WHERE ${articleTable.isFavorited} = true)::int`,
          readLaterCount: sql<number>`COUNT(*) FILTER (WHERE ${articleTable.isReadLater} = true)::int`,
          todayCount: sql<number>`COUNT(*) FILTER (WHERE ${articleTable.pubDate} >= NOW() - INTERVAL '24 hours')::int`,
          recentlyReadCount: sql<number>`COUNT(*) FILTER (WHERE ${articleTable.isRead} = true AND ${articleTable.updatedAt} >= NOW() - INTERVAL '7 days')::int`,
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

        const feedData = await parseFeed(
          existingFeed.url,
          existingFeed.feedType,
        )

        await ctx.db
          .update(feedTable)
          .set({
            lastRefreshedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(feedTable.id, input))

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
            redditPostId: true,
          },
        })

        const existingLinks = new Set(existingArticles.map((a) => a.link))
        const existingRedditPostIds = new Set(
          existingArticles
            .map((a) => a.redditPostId)
            .filter((id): id is string => id !== null),
        )

        const newArticles = feedData.articles.filter((article) => {
          if (article.redditPostId) {
            return !existingRedditPostIds.has(article.redditPostId)
          }
          return !existingLinks.has(article.link)
        })

        if (newArticles.length === 0) {
          await ctx.redis.invalidatePattern(`feed:*:user:${ctx.session.id}`)
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
            isFavorited: false,
            redditPostId: article.redditPostId,
            redditPermalink: article.redditPermalink,
            redditSubreddit: article.redditSubreddit,
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
  refreshAll: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      if (!refreshAllRateLimiter.consume(ctx.session.id, 1)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message:
            "Rate limit exceeded. Please wait 5 minutes before refreshing all feeds again.",
        })
      }

      const feeds = await ctx.db.query.feedTable.findMany({
        where: (feedTable, { eq, and }) =>
          and(
            eq(feedTable.userId, ctx.session.id),
            eq(feedTable.status, "published"),
          ),
      })

      if (feeds.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No feeds found to refresh.",
        })
      }

      let refreshedCount = 0
      let failedCount = 0
      let totalNewArticles = 0

      for (const feed of feeds) {
        try {
          const feedData = await parseFeed(feed.url, feed.feedType)

          await ctx.db
            .update(feedTable)
            .set({
              lastRefreshedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(feedTable.id, feed.id))

          if (feedData.articles.length > 0) {
            const existingArticles = await ctx.db.query.articleTable.findMany({
              where: (articleTable, { eq, and }) =>
                and(
                  eq(articleTable.feedId, feed.id),
                  eq(articleTable.status, "published"),
                ),
              columns: {
                link: true,
                redditPostId: true,
              },
            })

            const existingLinks = new Set(existingArticles.map((a) => a.link))
            const existingRedditPostIds = new Set(
              existingArticles
                .map((a) => a.redditPostId)
                .filter((id): id is string => id !== null),
            )

            const newArticles = feedData.articles.filter((article) => {
              if (article.redditPostId) {
                return !existingRedditPostIds.has(article.redditPostId)
              }
              return !existingLinks.has(article.link)
            })

            if (newArticles.length > 0) {
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
                  feedId: feed.id,
                  isRead: false,
                  isReadLater: false,
                  isFavorited: false,
                  redditPostId: article.redditPostId,
                  redditPermalink: article.redditPermalink,
                  redditSubreddit: article.redditSubreddit,
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
              totalNewArticles += newArticles.length
            }
          }

          refreshedCount++
        } catch (error) {
          failedCount++
          console.error(`Failed to refresh feed ${feed.id}:`, error)
        }
      }

      await ctx.redis.invalidatePattern(`feed:*:user:${ctx.session.id}`)
      await ctx.redis.invalidatePattern(`article:*:user:${ctx.session.id}`)
      await ctx.redis.deleteCache(`feed:statistics:user:${ctx.session.id}`)

      return {
        totalFeeds: feeds.length,
        refreshedFeeds: refreshedCount,
        failedFeeds: failedCount,
        newArticles: totalNewArticles,
      }
    } catch (error) {
      handleTRPCError(error)
    }
  }),

  /**
   * Auto-refresh stale feeds on user login
   *
   * Automatically refreshes feeds that are older than the user's configured refresh interval.
   * This procedure is designed for silent background refresh on login and bypasses rate limiting.
   * Only refreshes feeds that actually need updating based on lastRefreshedAt timestamp.
   *
   * @returns Summary with totalFeeds, refreshedFeeds, failedFeeds, and newArticles counts
   */
  autoRefresh: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const userSettings = await ctx.db.query.userSettingsTable.findFirst({
        where: eq(userSettingsTable.userId, ctx.session.id),
      })

      if (!userSettings?.autoRefreshEnabled) {
        return {
          totalFeeds: 0,
          refreshedFeeds: 0,
          failedFeeds: 0,
          newArticles: 0,
        }
      }

      const now = new Date()
      const intervalMs = userSettings.refreshIntervalHours * 60 * 60 * 1000

      const feeds = await ctx.db.query.feedTable.findMany({
        where: (feedTable, { eq, and }) =>
          and(
            eq(feedTable.userId, ctx.session.id),
            eq(feedTable.status, "published"),
          ),
      })

      if (feeds.length === 0) {
        return {
          totalFeeds: 0,
          refreshedFeeds: 0,
          failedFeeds: 0,
          newArticles: 0,
        }
      }

      const feedsToRefresh = feeds.filter((feed) => {
        if (!feed.lastRefreshedAt) return true
        const timeSinceRefresh =
          now.getTime() - new Date(feed.lastRefreshedAt).getTime()
        return timeSinceRefresh >= intervalMs
      })

      if (feedsToRefresh.length === 0) {
        return {
          totalFeeds: feeds.length,
          refreshedFeeds: 0,
          failedFeeds: 0,
          newArticles: 0,
        }
      }

      let refreshedCount = 0
      let failedCount = 0
      let totalNewArticles = 0

      for (const feed of feedsToRefresh) {
        try {
          const feedData = await parseFeed(feed.url, feed.feedType)

          await ctx.db
            .update(feedTable)
            .set({
              lastRefreshedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(feedTable.id, feed.id))

          if (feedData.articles.length > 0) {
            const existingArticles = await ctx.db.query.articleTable.findMany({
              where: (articleTable, { eq, and }) =>
                and(
                  eq(articleTable.feedId, feed.id),
                  eq(articleTable.status, "published"),
                ),
              columns: {
                link: true,
                redditPostId: true,
              },
            })

            const existingLinks = new Set(existingArticles.map((a) => a.link))
            const existingRedditPostIds = new Set(
              existingArticles
                .map((a) => a.redditPostId)
                .filter((id): id is string => id !== null),
            )

            const newArticles = feedData.articles.filter((article) => {
              if (article.redditPostId) {
                return !existingRedditPostIds.has(article.redditPostId)
              }
              return !existingLinks.has(article.link)
            })

            if (newArticles.length > 0) {
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
                  feedId: feed.id,
                  isRead: false,
                  isReadLater: false,
                  isFavorited: false,
                  redditPostId: article.redditPostId,
                  redditPermalink: article.redditPermalink,
                  redditSubreddit: article.redditSubreddit,
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
              totalNewArticles += newArticles.length
            }
          }

          refreshedCount++
        } catch (error) {
          failedCount++
          console.error(`Failed to auto-refresh feed ${feed.id}:`, error)
        }
      }

      if (refreshedCount > 0 || failedCount > 0) {
        await ctx.redis.invalidatePattern(`feed:*:user:${ctx.session.id}`)
        await ctx.redis.invalidatePattern(`article:*:user:${ctx.session.id}`)
        await ctx.redis.deleteCache(`feed:statistics:user:${ctx.session.id}`)
      }

      return {
        totalFeeds: feeds.length,
        refreshedFeeds: refreshedCount,
        failedFeeds: failedCount,
        newArticles: totalNewArticles,
      }
    } catch (error) {
      handleTRPCError(error)
    }
  }),

  /**
   * Cron-triggered feed refresh for all users with auto-refresh enabled
   *
   * This procedure is intended to be called by external cron services (e.g., GitHub Actions).
   * It requires a CRON_SECRET to be provided for authentication. Respects user settings
   * for auto-refresh enablement and refresh interval.
   *
   * @param secret - Authentication secret for cron job
   * @returns Summary with totalUsers, refreshedUsers, totalFeeds, and newArticles counts
   * @throws TRPCError if secret is invalid or not configured
   */
  refreshAllCron: publicProcedure
    .input(
      z.object({
        secret: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (!cronSecret) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "CRON_SECRET not configured on server.",
          })
        }

        if (input.secret !== cronSecret) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid CRON_SECRET.",
          })
        }

        const usersWithSettings = await ctx.db.query.userSettingsTable.findMany(
          {
            where: eq(userSettingsTable.autoRefreshEnabled, true),
          },
        )

        if (usersWithSettings.length === 0) {
          return {
            totalUsers: 0,
            refreshedUsers: 0,
            totalFeeds: 0,
            newArticles: 0,
          }
        }

        let refreshedUsersCount = 0
        let totalFeedsCount = 0
        let totalNewArticles = 0

        for (const userSettings of usersWithSettings) {
          const now = new Date()
          const intervalMs = userSettings.refreshIntervalHours * 60 * 60 * 1000

          const feeds = await ctx.db.query.feedTable.findMany({
            where: (feedTable, { eq, and }) =>
              and(
                eq(feedTable.userId, userSettings.userId),
                eq(feedTable.status, "published"),
              ),
          })

          if (feeds.length === 0) {
            continue
          }

          const feedsToRefresh = feeds.filter((feed) => {
            if (!feed.lastRefreshedAt) return true
            const timeSinceRefresh =
              now.getTime() - new Date(feed.lastRefreshedAt).getTime()
            return timeSinceRefresh >= intervalMs
          })

          if (feedsToRefresh.length === 0) {
            continue
          }

          let userNewArticles = 0

          for (const feed of feedsToRefresh) {
            try {
              const feedData = await parseFeed(feed.url, feed.feedType)

              await ctx.db
                .update(feedTable)
                .set({
                  lastRefreshedAt: new Date(),
                  updatedAt: new Date(),
                })
                .where(eq(feedTable.id, feed.id))

              if (feedData.articles.length > 0) {
                const existingArticles =
                  await ctx.db.query.articleTable.findMany({
                    where: (articleTable, { eq, and }) =>
                      and(
                        eq(articleTable.feedId, feed.id),
                        eq(articleTable.status, "published"),
                      ),
                    columns: {
                      link: true,
                      redditPostId: true,
                    },
                  })

                const existingLinks = new Set(
                  existingArticles.map((a) => a.link),
                )
                const existingRedditPostIds = new Set(
                  existingArticles
                    .map((a) => a.redditPostId)
                    .filter((id): id is string => id !== null),
                )

                const newArticles = feedData.articles.filter((article) => {
                  if (article.redditPostId) {
                    return !existingRedditPostIds.has(article.redditPostId)
                  }
                  return !existingLinks.has(article.link)
                })

                if (newArticles.length > 0) {
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
                      userId: userSettings.userId,
                      feedId: feed.id,
                      isRead: false,
                      isReadLater: false,
                      isFavorited: false,
                      redditPostId: article.redditPostId,
                      redditPermalink: article.redditPermalink,
                      redditSubreddit: article.redditSubreddit,
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
                  userNewArticles += newArticles.length
                }
              }

              totalFeedsCount++
            } catch (error) {
              console.error(`Failed to refresh feed ${feed.id}:`, error)
            }
          }

          if (userNewArticles > 0) {
            await ctx.redis.invalidatePattern(
              `feed:*:user:${userSettings.userId}`,
            )
            await ctx.redis.invalidatePattern(
              `article:*:user:${userSettings.userId}`,
            )
            await ctx.redis.deleteCache(
              `feed:statistics:user:${userSettings.userId}`,
            )
          }

          totalNewArticles += userNewArticles
          refreshedUsersCount++
        }

        return {
          totalUsers: usersWithSettings.length,
          refreshedUsers: refreshedUsersCount,
          totalFeeds: totalFeedsCount,
          newArticles: totalNewArticles,
        }
      } catch (error) {
        handleTRPCError(error)
      }
    }),
} satisfies TRPCRouterRecord
