import { and, eq, lt } from "drizzle-orm"
import z from "zod"

import { handleTRPCError } from "@/lib/api/error"
import { createTRPCRouter, protectedProcedure } from "@/lib/api/trpc"
import { articleTable, userSettingsTable } from "@/lib/db/schema"

/**
 * User management router providing operations for user profile and settings
 */
export const userRouter = createTRPCRouter({
  /**
   * Get current authenticated user information
   *
   * Returns the current user's profile data from the session including
   * ID, email, name, username, image, and role.
   *
   * @returns Current user profile data
   */
  getCurrentUser: protectedProcedure.query(({ ctx }) => {
    return {
      id: ctx.session.id,
      email: ctx.session.email,
      name: ctx.session.name,
      username: ctx.session.username,
      image: ctx.session.image,
      role: ctx.session.role,
    }
  }),

  /**
   * Get user settings for auto-refresh configuration and display preferences
   *
   * If settings don't exist yet, creates them with default values
   * (autoRefreshEnabled: true, refreshIntervalHours: 24, articleRetentionDays: 30, showFilterCountBadges: true)
   *
   * @returns User settings with auto-refresh, retention, and display preferences
   */
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    try {
      const cacheKey = `user:settings:${ctx.session.id}`
      const cached = await ctx.redis.getCache(cacheKey)
      if (cached) {
        return cached
      }

      let settings = await ctx.db.query.userSettingsTable.findFirst({
        where: eq(userSettingsTable.userId, ctx.session.id),
      })

      if (!settings) {
        const [newSettings] = await ctx.db
          .insert(userSettingsTable)
          .values({
            userId: ctx.session.id,
            autoRefreshEnabled: true,
            refreshIntervalHours: 24,
            articleRetentionDays: 30,
            showFilterCountBadges: true,
          })
          .returning()
        settings = newSettings
      }

      await ctx.redis.setCache(cacheKey, settings, 3600)
      return settings
    } catch (error) {
      handleTRPCError(error)
    }
  }),

  /**
   * Update user settings for auto-refresh configuration, article retention, and display preferences
   *
   * @param autoRefreshEnabled - Enable/disable automatic feed refresh
   * @param refreshIntervalHours - Hours between automatic refreshes (1-168)
   * @param articleRetentionDays - Days to keep articles before expiring (1-365)
   * @param showFilterCountBadges - Show/hide article count badges on filter options
   * @returns Updated user settings
   * @throws TRPCError if settings not found
   */
  updateSettings: protectedProcedure
    .input(
      z.object({
        autoRefreshEnabled: z.boolean().optional(),
        refreshIntervalHours: z.number().min(1).max(168).optional(),
        articleRetentionDays: z.number().min(1).max(365).optional(),
        showFilterCountBadges: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const existingSettings = await ctx.db.query.userSettingsTable.findFirst(
          {
            where: eq(userSettingsTable.userId, ctx.session.id),
          },
        )

        if (!existingSettings) {
          const [newSettings] = await ctx.db
            .insert(userSettingsTable)
            .values({
              userId: ctx.session.id,
              autoRefreshEnabled: input.autoRefreshEnabled ?? true,
              refreshIntervalHours: input.refreshIntervalHours ?? 24,
              articleRetentionDays: input.articleRetentionDays ?? 30,
              showFilterCountBadges: input.showFilterCountBadges ?? true,
            })
            .returning()

          await ctx.redis.deleteCache(`user:settings:${ctx.session.id}`)
          return newSettings
        }

        const [updatedSettings] = await ctx.db
          .update(userSettingsTable)
          .set({
            autoRefreshEnabled:
              input.autoRefreshEnabled ?? existingSettings.autoRefreshEnabled,
            refreshIntervalHours:
              input.refreshIntervalHours ??
              existingSettings.refreshIntervalHours,
            articleRetentionDays:
              input.articleRetentionDays ??
              existingSettings.articleRetentionDays,
            showFilterCountBadges:
              input.showFilterCountBadges ??
              existingSettings.showFilterCountBadges,
            updatedAt: new Date(),
          })
          .where(eq(userSettingsTable.userId, ctx.session.id))
          .returning()

        await ctx.redis.deleteCache(`user:settings:${ctx.session.id}`)
        return updatedSettings
      } catch (error) {
        handleTRPCError(error)
      }
    }),

  /**
   * Expire articles for current user based on their retention settings
   *
   * Marks articles as "expired" if they are older than the user's configured
   * articleRetentionDays setting. Only affects articles with status "published".
   * This provides immediate expiration when user changes retention settings,
   * complementing the scheduled cron job that runs system-wide.
   *
   * @returns Statistics about expired articles
   */
  expireMyArticles: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const settings = await ctx.db.query.userSettingsTable.findFirst({
        where: eq(userSettingsTable.userId, ctx.session.id),
      })

      if (!settings) {
        return {
          success: false,
          articlesExpired: 0,
          message: "User settings not found",
        }
      }

      const now = new Date()
      const retentionDays = settings.articleRetentionDays
      const expirationDate = new Date(now)
      expirationDate.setDate(expirationDate.getDate() - retentionDays)

      const expiredArticles = await ctx.db
        .update(articleTable)
        .set({
          status: "expired",
          updatedAt: now,
        })
        .where(
          and(
            eq(articleTable.userId, ctx.session.id),
            eq(articleTable.status, "published"),
            lt(articleTable.createdAt, expirationDate),
          ),
        )
        .returning({ id: articleTable.id })

      return {
        success: true,
        articlesExpired: expiredArticles.length,
        retentionDays,
      }
    } catch (error) {
      handleTRPCError(error)
    }
  }),
})
