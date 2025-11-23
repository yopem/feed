import crypto from "crypto"
import { TRPCError } from "@trpc/server"
import bcryptjs from "bcryptjs"
import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  gte,
  ilike,
  lt,
  or,
  sql,
} from "drizzle-orm"
import z from "zod"

import { handleTRPCError } from "@/lib/api/error"
import {
  createTRPCRouter,
  protectedProcedure,
  rateLimitedPublicProcedure,
} from "@/lib/api/trpc"
import {
  articleShareViewTable,
  articleTable,
  feedTable,
  type SelectArticle,
  type SelectFeed,
} from "@/lib/db/schema"
import { lookupGeoLocation } from "@/lib/utils/geolocation"
import { generateSlug } from "@/lib/utils/slug"

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
  byPublicSlugAndUsername: rateLimitedPublicProcedure
    .input(
      z.object({
        username: z.string(),
        slug: z.string().min(3).max(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const cacheKey = `feed:article:public:${input.username}:${input.slug}`
        const cached = await ctx.redis.getCache<
          ArticleWithFeed & { isPasswordProtected: boolean }
        >(cacheKey)
        if (cached) {
          return cached
        }

        const article = await ctx.db.query.articleTable.findFirst({
          where: and(
            eq(articleTable.shareSlug, input.slug),
            eq(articleTable.username, input.username),
            eq(articleTable.isPubliclyShared, true),
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

        if (!article) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Shared article not found.",
          })
        }

        const now = new Date()

        if (article.shareExpiresAt && article.shareExpiresAt < now) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "This shared link has expired.",
          })
        }

        const result = {
          ...article,
          feed: {
            title: article.feed.title,
            slug: article.feed.slug,
            imageUrl: article.feed.imageUrl,
          },
          isPasswordProtected: !!article.sharePassword,
        }

        await ctx.redis.setCache(cacheKey, result, 60)
        return result
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  /**
   * Public endpoint to fetch article by share slug only
   *
   * Looks up a shared article by its shareSlug alone (without username).
   * Returns minimal article information including username needed for
   * redirecting to the full share URL.
   *
   * @param shareSlug - The share slug
   * @returns Article with username and password protection status
   * @throws NOT_FOUND if article doesn't exist or link expired
   */
  byShareSlug: rateLimitedPublicProcedure
    .input(
      z.object({
        shareSlug: z.string().min(3).max(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const cacheKey = `feed:article:public:shareSlug:${input.shareSlug}`
        const cached = await ctx.redis.getCache<{
          username: string | null
          isPasswordProtected: boolean
        }>(cacheKey)
        if (cached) {
          return cached
        }

        const article = await ctx.db.query.articleTable.findFirst({
          where: and(
            eq(articleTable.shareSlug, input.shareSlug),
            eq(articleTable.isPubliclyShared, true),
            eq(articleTable.status, "published"),
          ),
          columns: {
            username: true,
            sharePassword: true,
            shareExpiresAt: true,
          },
        })

        if (!article) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Shared article not found.",
          })
        }

        const now = new Date()

        if (article.shareExpiresAt && article.shareExpiresAt < now) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "This shared link has expired.",
          })
        }

        const result = {
          username: article.username,
          isPasswordProtected: !!article.sharePassword,
        }

        await ctx.redis.setCache(cacheKey, result, 60)
        return result
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  /**
   * Public endpoint to verify a password-protected shared article
   *
   * Verifies that the provided password matches the share password for an article.
   * Used for accessing password-protected shared articles.
   *
   * @param username - The article owner's username
   * @param slug - The share slug
   * @param password - The password to verify
   * @returns Success status and article ID if password is correct
   * @throws UNAUTHORIZED if password is incorrect
   * @throws NOT_FOUND if article doesn't exist
   */
  verifySharePassword: rateLimitedPublicProcedure
    .input(
      z.object({
        username: z.string(),
        slug: z.string(),
        password: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const article = await ctx.db.query.articleTable.findFirst({
          where: and(
            eq(articleTable.username, input.username),
            eq(articleTable.shareSlug, input.slug),
            eq(articleTable.isPubliclyShared, true),
            eq(articleTable.status, "published"),
          ),
        })

        if (!article?.sharePassword) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Article not found.",
          })
        }

        const isValid = await bcryptjs.compare(
          input.password,
          article.sharePassword,
        )

        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Incorrect password.",
          })
        }

        return { success: true, articleId: article.id }
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  /**
   * Protected endpoint to toggle public sharing for an article
   *
   * Enables or disables public sharing for an article. When enabled,
   * generates a unique short URL slug if not already present and stores the username.
   *
   * @param id - Article ID
   * @param isPubliclyShared - Whether to enable or disable sharing
   * @returns Updated article with share settings
   */
  togglePublicShare: protectedProcedure
    .input(z.object({ id: z.string(), isPubliclyShared: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const article = await ctx.db.query.articleTable.findFirst({
          where: and(
            eq(articleTable.id, input.id),
            eq(articleTable.userId, ctx.session.id),
            eq(articleTable.status, "published"),
          ),
        })

        if (!article) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Article not found.",
          })
        }

        let shareSlug = article.shareSlug

        if (input.isPubliclyShared && !shareSlug) {
          shareSlug = generateSlug()

          let attempts = 0
          const maxAttempts = 5

          while (attempts < maxAttempts) {
            const existing = await ctx.db.query.articleTable.findFirst({
              where: and(
                eq(articleTable.shareSlug, shareSlug),
                eq(articleTable.userId, ctx.session.id),
              ),
            })

            if (!existing) break

            shareSlug = generateSlug()
            attempts++
          }

          if (attempts === maxAttempts) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to generate unique share slug.",
            })
          }
        }

        const updated = await ctx.db
          .update(articleTable)
          .set({
            isPubliclyShared: input.isPubliclyShared,
            shareSlug: input.isPubliclyShared ? shareSlug : null,
            username: input.isPubliclyShared ? ctx.session.username : null,
            sharePassword: input.isPubliclyShared
              ? article.sharePassword
              : null,
            shareExpiresAt: input.isPubliclyShared
              ? article.shareExpiresAt
              : null,
            updatedAt: new Date(),
          })
          .where(eq(articleTable.id, input.id))
          .returning()

        await ctx.redis.deleteCache(
          `feed:article:${input.id}:user:${ctx.session.id}`,
        )

        if (input.isPubliclyShared && shareSlug) {
          await ctx.redis.deleteCache(
            `feed:article:public:${ctx.session.username}:${shareSlug}`,
          )
        }

        return updated[0]
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  /**
   * Protected endpoint to update share settings for an article
   *
   * Updates password protection, expiration date, and custom slug for a shared article.
   * Validates that custom slugs are unique within the user's articles.
   *
   * @param id - Article ID
   * @param shareSlug - Optional custom slug
   * @param sharePassword - Optional password (will be hashed)
   * @param shareExpiresAt - Optional expiration date
   * @returns Updated article
   */
  updateShareSettings: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        shareSlug: z.string().min(3).max(50).optional().or(z.literal("")),
        sharePassword: z.string().min(4).max(100).optional().or(z.literal("")),
        shareExpiresAt: z.date().optional().or(z.null()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const article = await ctx.db.query.articleTable.findFirst({
          where: and(
            eq(articleTable.id, input.id),
            eq(articleTable.userId, ctx.session.id),
            eq(articleTable.isPubliclyShared, true),
          ),
        })

        if (!article) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Article not found or not publicly shared.",
          })
        }

        if (input.shareSlug && input.shareSlug !== article.shareSlug) {
          const existing = await ctx.db.query.articleTable.findFirst({
            where: and(
              eq(articleTable.shareSlug, input.shareSlug),
              eq(articleTable.userId, ctx.session.id),
            ),
          })

          if (existing) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "This slug is already in use.",
            })
          }
        }

        const updates: {
          shareSlug?: string
          sharePassword?: string | null
          shareExpiresAt?: Date | null
          updatedAt: Date
        } = {
          updatedAt: new Date(),
        }

        if (input.shareSlug) {
          updates.shareSlug = input.shareSlug
        }

        if (input.sharePassword !== undefined) {
          updates.sharePassword = input.sharePassword
            ? await bcryptjs.hash(input.sharePassword, 10)
            : null
        }

        if (input.shareExpiresAt !== undefined) {
          updates.shareExpiresAt = input.shareExpiresAt ?? null
        }

        const updated = await ctx.db
          .update(articleTable)
          .set(updates)
          .where(eq(articleTable.id, input.id))
          .returning()

        await ctx.redis.deleteCache(
          `feed:article:${input.id}:user:${ctx.session.id}`,
        )

        const currentSlug = updates.shareSlug ?? article.shareSlug
        await ctx.redis.deleteCache(
          `feed:article:public:${ctx.session.username}:${currentSlug}`,
        )

        await ctx.redis.deleteCache(
          `feed:article:public:shareSlug:${currentSlug}`,
        )

        if (article.shareSlug && article.shareSlug !== currentSlug) {
          await ctx.redis.deleteCache(
            `feed:article:public:${ctx.session.username}:${article.shareSlug}`,
          )
          await ctx.redis.deleteCache(
            `feed:article:public:shareSlug:${article.shareSlug}`,
          )
        }

        return updated[0]
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  /**
   * Public endpoint to track a view on a shared article
   *
   * Records a view event for analytics including geographic location data.
   * IP addresses are anonymized using SHA-256 hashing for privacy after
   * geolocation lookup. Updates view count and last viewed timestamp.
   *
   * @param username - The article owner's username
   * @param slug - Share slug
   * @param ipAddress - Client IP address (will be geolocated then hashed)
   * @param userAgent - Client user agent string
   * @param referer - HTTP Referer header
   * @returns Success status
   */
  trackView: rateLimitedPublicProcedure
    .input(
      z.object({
        username: z.string(),
        slug: z.string(),
        userAgent: z.string().optional(),
        referer: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const article = await ctx.db.query.articleTable.findFirst({
          where: and(
            eq(articleTable.username, input.username),
            eq(articleTable.shareSlug, input.slug),
            eq(articleTable.isPubliclyShared, true),
            eq(articleTable.status, "published"),
          ),
        })

        if (!article) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Article not found.",
          })
        }

        let ipHash: string | null = null
        let country: string | null = null
        let city: string | null = null

        const ipAddress = ctx.clientIP

        if (ipAddress && ipAddress !== "unknown") {
          const geo = await lookupGeoLocation(ipAddress)
          country = geo.country
          city = geo.city

          ipHash = crypto.createHash("sha256").update(ipAddress).digest("hex")
        }

        await ctx.db.insert(articleShareViewTable).values({
          articleId: article.id,
          ipHash,
          userAgent: input.userAgent,
          referer: input.referer,
          country,
          city,
          viewedAt: new Date(),
        })

        await ctx.db
          .update(articleTable)
          .set({
            shareViewCount: (article.shareViewCount || 0) + 1,
            shareLastViewedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(articleTable.id, article.id))

        await ctx.redis.deleteCache(
          `feed:article:public:${input.username}:${input.slug}`,
        )
        const analyticsPattern = `feed:article:analytics:${article.id}:*`
        await ctx.redis.invalidatePattern(analyticsPattern)

        return { success: true }
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  /**
   * Protected endpoint to retrieve share analytics for an article
   *
   * Fetches detailed analytics including total views, unique views,
   * views over time, top referrers, geographic distribution, and
   * device/browser statistics.
   *
   * @param id - Article ID
   * @param dateRange - Optional date range filter
   * @returns Comprehensive analytics data
   */
  getShareAnalytics: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        dateRange: z
          .object({
            from: z.date(),
            to: z.date(),
          })
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const article = await ctx.db.query.articleTable.findFirst({
          where: and(
            eq(articleTable.id, input.id),
            eq(articleTable.userId, ctx.session.id),
          ),
        })

        if (!article) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Article not found.",
          })
        }

        const cacheKey = `feed:article:analytics:${input.id}:${input.dateRange ? input.dateRange.from.toISOString() : "all"}:${input.dateRange ? input.dateRange.to.toISOString() : "all"}`
        const cached = await ctx.redis.getCache<{
          totalViews: number
          uniqueViews: number
          shareViewCount: number
          shareLastViewedAt: Date | null
          viewsOverTime: { date: string; views: number }[]
          topReferrers: { referer: string; count: number }[]
          geographicData: { country: string; count: number }[]
        }>(cacheKey)
        if (cached) {
          return cached
        }

        const dateConditions = [eq(articleShareViewTable.articleId, input.id)]
        if (input.dateRange) {
          dateConditions.push(
            gte(articleShareViewTable.viewedAt, input.dateRange.from),
          )
          dateConditions.push(
            lt(articleShareViewTable.viewedAt, input.dateRange.to),
          )
        }

        const [totalViewsResult] = await ctx.db
          .select({ count: count() })
          .from(articleShareViewTable)
          .where(and(...dateConditions))

        const [uniqueViewsResult] = await ctx.db
          .select({ count: countDistinct(articleShareViewTable.ipHash) })
          .from(articleShareViewTable)
          .where(and(...dateConditions))

        const viewsOverTime = await ctx.db
          .select({
            date: sql<string>`DATE(${articleShareViewTable.viewedAt})`,
            count: count(),
          })
          .from(articleShareViewTable)
          .where(and(...dateConditions))
          .groupBy(sql`DATE(${articleShareViewTable.viewedAt})`)
          .orderBy(sql`DATE(${articleShareViewTable.viewedAt})`)

        const topReferrers = await ctx.db
          .select({
            referer: articleShareViewTable.referer,
            count: count(),
          })
          .from(articleShareViewTable)
          .where(and(...dateConditions))
          .groupBy(articleShareViewTable.referer)
          .orderBy(desc(count()))
          .limit(10)

        const geographicData = await ctx.db
          .select({
            country: articleShareViewTable.country,
            count: count(),
          })
          .from(articleShareViewTable)
          .where(and(...dateConditions))
          .groupBy(articleShareViewTable.country)
          .orderBy(desc(count()))

        const result = {
          totalViews: totalViewsResult.count,
          uniqueViews: uniqueViewsResult.count,
          shareViewCount: article.shareViewCount,
          shareLastViewedAt: article.shareLastViewedAt,
          viewsOverTime: viewsOverTime.map((v) => ({
            date: v.date,
            views: v.count,
          })),
          topReferrers: topReferrers.map((r) => ({
            referer: r.referer ?? "Direct",
            count: r.count,
          })),
          geographicData: geographicData.map((g) => ({
            country: g.country ?? "Unknown",
            count: g.count,
          })),
        }

        await ctx.redis.setCache(cacheKey, result, 300)
        return result
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  /**
   * Global search across articles and feeds
   *
   * Searches article titles, descriptions, and feed names for matching content.
   * Returns combined results sorted by relevance (exact matches first).
   *
   * @param query - Search query string (minimum 2 characters)
   * @param limit - Maximum number of results (default 20, max 50)
   * @returns Combined search results with articles and feeds
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
