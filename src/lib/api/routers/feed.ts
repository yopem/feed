import { ORPCError } from "@orpc/server"
import { eq } from "drizzle-orm"
import z from "zod"

import { handleORPCError } from "@/lib/api/error"
import { protectedProcedure, publicProcedure } from "@/lib/api/orpc"
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

const refreshAllRateLimiter = createTokenBucket<string>(1, 300)

export const feedRouter = {
  create: protectedProcedure
    .input(z.url().min(1, "URL is required"))
    .handler(async ({ context, input }) => {
      try {
        const trimmedInput = input.trim()
        if (!trimmedInput) {
          throw new ORPCError("BAD_REQUEST", {
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

        const existingFeed = await context.db.query.feedTable.findFirst({
          where: (feedTable, { eq, and }) =>
            and(
              eq(feedTable.userId, context.session.id),
              eq(feedTable.url, normalizedUrl),
              eq(feedTable.status, "published"),
            ),
        })

        if (existingFeed) {
          throw new ORPCError("CONFLICT", {
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
          const existingSlug = await context.db.query.feedTable.findFirst({
            where: (feedTable, { eq, and }) =>
              and(
                eq(feedTable.userId, context.session.id),
                eq(feedTable.slug, slug),
                eq(feedTable.status, "published"),
              ),
          })

          if (!existingSlug) break
          slug = `${baseSlug}-${suffix}`
          suffix++
        }

        const [feed] = await context.db
          .insert(feedTable)
          .values({
            title: feedTitle,
            description: feedData.description,
            url: normalizedUrl,
            slug,
            imageUrl: feedData.imageUrl,
            userId: context.session.id,
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
              userId: context.session.id,
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

          await context.db.insert(articleTable).values(finalArticles)
        }

        await context.redis.invalidatePattern(
          `feed:*:user:${context.session.id}`,
        )

        return feed
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message.includes("feed") ||
            error.message.includes("URL") ||
            error.message.includes("timed out") ||
            error.message.includes("fetch")
          ) {
            throw new ORPCError("BAD_REQUEST", {
              message: error.message,
            })
          }
        }
        handleORPCError(error)
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
    .handler(async ({ context, input }) => {
      try {
        const { eq, and } = await import("drizzle-orm")

        const existingFeed = await context.db.query.feedTable.findFirst({
          where: and(
            eq(feedTable.id, input.id),
            eq(feedTable.userId, context.session.id),
            eq(feedTable.status, "published"),
          ),
        })

        if (!existingFeed) {
          throw new ORPCError("NOT_FOUND", {
            message: "Feed not found.",
          })
        }

        const [updatedFeed] = await context.db
          .update(feedTable)
          .set({
            title: input.title ?? existingFeed.title,
            description: input.description ?? existingFeed.description,
            updatedAt: new Date(),
          })
          .where(eq(feedTable.id, input.id))
          .returning()

        await context.redis.invalidatePattern(
          `feed:*:user:${context.session.id}`,
        )

        return updatedFeed
      } catch (error) {
        handleORPCError(error)
      }
    }),

  delete: protectedProcedure
    .input(z.string())
    .handler(async ({ context, input }) => {
      try {
        const { eq, and } = await import("drizzle-orm")

        const existingFeed = await context.db.query.feedTable.findFirst({
          where: and(
            eq(feedTable.id, input),
            eq(feedTable.userId, context.session.id),
            eq(feedTable.status, "published"),
          ),
        })

        if (!existingFeed) {
          throw new ORPCError("NOT_FOUND", {
            message: "Feed not found.",
          })
        }

        await context.db
          .update(feedTable)
          .set({ status: "deleted", updatedAt: new Date() })
          .where(eq(feedTable.id, input))

        await context.db
          .update(articleTable)
          .set({ status: "deleted", updatedAt: new Date() })
          .where(eq(articleTable.feedId, input))

        await context.redis.invalidatePattern(
          `feed:*:user:${context.session.id}`,
        )
        await context.redis.invalidatePattern(
          `article:*:user:${context.session.id}`,
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

        const existingFeed = await context.db.query.feedTable.findFirst({
          where: and(
            eq(feedTable.id, input.id),
            eq(feedTable.userId, context.session.id),
            eq(feedTable.status, "published"),
          ),
        })

        if (!existingFeed) {
          throw new ORPCError("NOT_FOUND", {
            message: "Feed not found.",
          })
        }

        const [updatedFeed] = await context.db
          .update(feedTable)
          .set({ isFavorited: input.isFavorited, updatedAt: new Date() })
          .where(eq(feedTable.id, input.id))
          .returning()

        await context.redis.invalidatePattern(
          `feed:*:user:${context.session.id}`,
        )

        return updatedFeed
      } catch (error) {
        handleORPCError(error)
      }
    }),

  all: protectedProcedure
    .input(z.object({ page: z.number(), perPage: z.number() }))
    .handler(async ({ context, input }) => {
      try {
        const cacheKey = `feed:feeds:page:${input.page}:per:${input.perPage}:user:${context.session.id}`
        const cached = await context.redis.getCache<SelectFeed[]>(cacheKey)
        if (cached) {
          return cached
        }
        const data = await context.db.query.feedTable.findMany({
          where: (feedTable, { eq, and }) =>
            and(
              eq(feedTable.userId, context.session.id),
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
          throw new ORPCError("NOT_FOUND", {
            message: "No feeds found for the user.",
          })
        }
        await context.redis.setCache(cacheKey, filteredData, 1800)
        return filteredData
      } catch (error) {
        handleORPCError(error)
      }
    }),

  byId: protectedProcedure
    .input(z.string())
    .handler(async ({ context, input }) => {
      try {
        const cacheKey = `feed:feed:${input}:user:${context.session.id}`
        const cached = await context.redis.getCache<SelectFeed>(cacheKey)
        if (cached) {
          return cached
        }
        const data = await context.db.query.feedTable.findFirst({
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
          throw new ORPCError("NOT_FOUND", {
            message: "Feed not found.",
          })
        }
        const filteredData = {
          ...data,
          tags: data.tags.filter((ft) => ft.tag.status === "published"),
        }
        await context.redis.setCache(cacheKey, filteredData, 1800)
        return filteredData
      } catch (error) {
        handleORPCError(error)
      }
    }),

  bySlug: protectedProcedure
    .input(z.string())
    .handler(async ({ context, input }) => {
      try {
        const cacheKey = `feed:feed:slug:${input}:user:${context.session.id}`
        const cached = await context.redis.getCache<SelectFeed>(cacheKey)
        if (cached) {
          return cached
        }
        const { eq, and } = await import("drizzle-orm")
        const data = await context.db.query.feedTable.findFirst({
          where: and(
            eq(feedTable.slug, input),
            eq(feedTable.userId, context.session.id),
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
          throw new ORPCError("NOT_FOUND", {
            message: "Feed not found.",
          })
        }
        const filteredData = {
          ...data,
          tags: data.tags.filter((ft) => ft.tag.status === "published"),
        }
        await context.redis.setCache(cacheKey, filteredData, 1800)
        return filteredData
      } catch (error) {
        handleORPCError(error)
      }
    }),

  statistics: protectedProcedure.handler(async ({ context }) => {
    try {
      const cacheKey = `feed:statistics:user:${context.session.id}`
      const cached = await context.redis.getCache<
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
            eq(articleTable.userId, context.session.id),
            eq(articleTable.status, "published"),
          ),
        )
        .groupBy(articleTable.feedId)

      await context.redis.setCache(cacheKey, stats, 1800)
      return stats
    } catch (error) {
      handleORPCError(error)
    }
  }),

  assignTags: protectedProcedure
    .input(
      z.object({
        feedId: z.string(),
        tagIds: z.array(z.string()),
      }),
    )
    .handler(async ({ context, input }) => {
      try {
        const { eq, and, inArray } = await import("drizzle-orm")

        const existingFeed = await context.db.query.feedTable.findFirst({
          where: and(
            eq(feedTable.id, input.feedId),
            eq(feedTable.userId, context.session.id),
            eq(feedTable.status, "published"),
          ),
        })

        if (!existingFeed) {
          throw new ORPCError("NOT_FOUND", {
            message: "Feed not found.",
          })
        }

        if (input.tagIds.length > 0) {
          const tags = await context.db.query.tagTable.findMany({
            where: and(
              inArray(tagTable.id, input.tagIds),
              eq(tagTable.userId, context.session.id),
              eq(tagTable.status, "published"),
            ),
          })

          if (tags.length !== input.tagIds.length) {
            throw new ORPCError("NOT_FOUND", {
              message: "One or more tags not found.",
            })
          }

          await context.db
            .delete(feedTagsTable)
            .where(eq(feedTagsTable.feedId, input.feedId))

          const tagAssignments = input.tagIds.map((tagId) => ({
            feedId: input.feedId,
            tagId,
          }))
          await context.db.insert(feedTagsTable).values(tagAssignments)
        } else {
          await context.db
            .delete(feedTagsTable)
            .where(eq(feedTagsTable.feedId, input.feedId))
        }

        await context.redis.invalidatePattern(
          `feed:*:user:${context.session.id}`,
        )

        return { success: true }
      } catch (error) {
        handleORPCError(error)
      }
    }),

  unassignTag: protectedProcedure
    .input(
      z.object({
        feedId: z.string(),
        tagId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      try {
        const { eq, and } = await import("drizzle-orm")

        const existingFeed = await context.db.query.feedTable.findFirst({
          where: and(
            eq(feedTable.id, input.feedId),
            eq(feedTable.userId, context.session.id),
            eq(feedTable.status, "published"),
          ),
        })

        if (!existingFeed) {
          throw new ORPCError("NOT_FOUND", {
            message: "Feed not found.",
          })
        }

        await context.db
          .delete(feedTagsTable)
          .where(
            and(
              eq(feedTagsTable.feedId, input.feedId),
              eq(feedTagsTable.tagId, input.tagId),
            ),
          )

        await context.redis.invalidatePattern(
          `feed:*:user:${context.session.id}`,
        )

        return { success: true }
      } catch (error) {
        handleORPCError(error)
      }
    }),

  refresh: protectedProcedure
    .input(z.string())
    .handler(async ({ context, input }) => {
      try {
        const { eq, and } = await import("drizzle-orm")

        const existingFeed = await context.db.query.feedTable.findFirst({
          where: and(
            eq(feedTable.id, input),
            eq(feedTable.userId, context.session.id),
            eq(feedTable.status, "published"),
          ),
        })

        if (!existingFeed) {
          throw new ORPCError("NOT_FOUND", {
            message: "Feed not found.",
          })
        }

        const feedData = await parseFeed(
          existingFeed.url,
          existingFeed.feedType,
        )

        await context.db
          .update(feedTable)
          .set({
            lastRefreshedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(feedTable.id, input))

        if (feedData.articles.length === 0) {
          return { newArticles: 0 }
        }

        const existingArticles = await context.db.query.articleTable.findMany({
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
          await context.redis.invalidatePattern(
            `feed:*:user:${context.session.id}`,
          )
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
            userId: context.session.id,
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

        await context.db.insert(articleTable).values(finalArticles)

        await context.redis.invalidatePattern(
          `feed:*:user:${context.session.id}`,
        )
        await context.redis.invalidatePattern(
          `article:*:user:${context.session.id}`,
        )
        await context.redis.deleteCache(
          `feed:statistics:user:${context.session.id}`,
        )

        return { newArticles: newArticles.length }
      } catch (error) {
        handleORPCError(error)
      }
    }),

  refreshAll: protectedProcedure.handler(async ({ context }) => {
    try {
      if (!refreshAllRateLimiter.consume(context.session.id, 1)) {
        throw new ORPCError("TOO_MANY_REQUESTS", {
          message:
            "Rate limit exceeded. Please wait 5 minutes before refreshing all feeds again.",
        })
      }

      const feeds = await context.db.query.feedTable.findMany({
        where: (feedTable, { eq, and }) =>
          and(
            eq(feedTable.userId, context.session.id),
            eq(feedTable.status, "published"),
          ),
      })

      if (feeds.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "No feeds found to refresh.",
        })
      }

      let refreshedCount = 0
      let failedCount = 0
      let totalNewArticles = 0

      for (const feed of feeds) {
        try {
          const feedData = await parseFeed(feed.url, feed.feedType)

          await context.db
            .update(feedTable)
            .set({
              lastRefreshedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(feedTable.id, feed.id))

          if (feedData.articles.length > 0) {
            const existingArticles =
              await context.db.query.articleTable.findMany({
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
                  userId: context.session.id,
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

              await context.db.insert(articleTable).values(finalArticles)
              totalNewArticles += newArticles.length
            }
          }

          refreshedCount++
        } catch (error) {
          failedCount++
          console.error(`Failed to refresh feed ${feed.id}:`, error)
        }
      }

      await context.redis.invalidatePattern(`feed:*:user:${context.session.id}`)
      await context.redis.invalidatePattern(
        `article:*:user:${context.session.id}`,
      )
      await context.redis.deleteCache(
        `feed:statistics:user:${context.session.id}`,
      )

      return {
        totalFeeds: feeds.length,
        refreshedFeeds: refreshedCount,
        failedFeeds: failedCount,
        newArticles: totalNewArticles,
      }
    } catch (error) {
      handleORPCError(error)
    }
  }),

  autoRefresh: protectedProcedure.handler(async ({ context }) => {
    try {
      const userSettings = await context.db.query.userSettingsTable.findFirst({
        where: eq(userSettingsTable.userId, context.session.id),
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

      const feeds = await context.db.query.feedTable.findMany({
        where: (feedTable, { eq, and }) =>
          and(
            eq(feedTable.userId, context.session.id),
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

          await context.db
            .update(feedTable)
            .set({
              lastRefreshedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(feedTable.id, feed.id))

          if (feedData.articles.length > 0) {
            const existingArticles =
              await context.db.query.articleTable.findMany({
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
                  userId: context.session.id,
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

              await context.db.insert(articleTable).values(finalArticles)
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
        await context.redis.invalidatePattern(
          `feed:*:user:${context.session.id}`,
        )
        await context.redis.invalidatePattern(
          `article:*:user:${context.session.id}`,
        )
        await context.redis.deleteCache(
          `feed:statistics:user:${context.session.id}`,
        )
      }

      return {
        totalFeeds: feeds.length,
        refreshedFeeds: refreshedCount,
        failedFeeds: failedCount,
        newArticles: totalNewArticles,
      }
    } catch (error) {
      handleORPCError(error)
    }
  }),

  refreshAllCron: publicProcedure
    .input(
      z.object({
        secret: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      try {
        if (!cronSecret) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "CRON_SECRET not configured on server.",
          })
        }

        if (input.secret !== cronSecret) {
          throw new ORPCError("UNAUTHORIZED", {
            message: "Invalid CRON_SECRET.",
          })
        }

        const usersWithSettings =
          await context.db.query.userSettingsTable.findMany({
            where: eq(userSettingsTable.autoRefreshEnabled, true),
          })

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

          const feeds = await context.db.query.feedTable.findMany({
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

              await context.db
                .update(feedTable)
                .set({
                  lastRefreshedAt: new Date(),
                  updatedAt: new Date(),
                })
                .where(eq(feedTable.id, feed.id))

              if (feedData.articles.length > 0) {
                const existingArticles =
                  await context.db.query.articleTable.findMany({
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

                  await context.db.insert(articleTable).values(finalArticles)
                  userNewArticles += newArticles.length
                }
              }

              totalFeedsCount++
            } catch (error) {
              console.error(`Failed to refresh feed ${feed.id}:`, error)
            }
          }

          if (userNewArticles > 0) {
            await context.redis.invalidatePattern(
              `feed:*:user:${userSettings.userId}`,
            )
            await context.redis.invalidatePattern(
              `article:*:user:${userSettings.userId}`,
            )
            await context.redis.deleteCache(
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
        handleORPCError(error)
      }
    }),
}
