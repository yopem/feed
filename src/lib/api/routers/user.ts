import { and, eq, lt } from "drizzle-orm"
import z from "zod"

import { handleORPCError } from "@/lib/api/error"
import { protectedProcedure } from "@/lib/api/orpc"
import { articleTable, userSettingsTable } from "@/lib/db/schema"

export const userRouter = {
  getCurrentUser: protectedProcedure.handler(({ context }) => {
    return {
      id: context.session.id,
      email: context.session.email,
      name: context.session.name,
      username: context.session.username,
      image: context.session.image,
      role: context.session.role,
    }
  }),

  getSettings: protectedProcedure.handler(async ({ context }) => {
    try {
      const cacheKey = `user:settings:${context.session.id}`
      const cached = await context.redis.getCache(cacheKey)
      if (cached) {
        return cached
      }

      let settings = await context.db.query.userSettingsTable.findFirst({
        where: eq(userSettingsTable.userId, context.session.id),
      })

      if (!settings) {
        const [newSettings] = await context.db
          .insert(userSettingsTable)
          .values({
            userId: context.session.id,
            autoRefreshEnabled: true,
            refreshIntervalHours: 24,
            articleRetentionDays: 30,
            showFilterCountBadges: true,
          })
          .returning()
        settings = newSettings
      }

      await context.redis.setCache(cacheKey, settings, 3600)
      return settings
    } catch (error) {
      handleORPCError(error)
    }
  }),

  updateSettings: protectedProcedure
    .input(
      z.object({
        autoRefreshEnabled: z.boolean().optional(),
        refreshIntervalHours: z.number().min(1).max(168).optional(),
        articleRetentionDays: z.number().min(1).max(365).optional(),
        showFilterCountBadges: z.boolean().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      try {
        const existingSettings =
          await context.db.query.userSettingsTable.findFirst({
            where: eq(userSettingsTable.userId, context.session.id),
          })

        if (!existingSettings) {
          const [newSettings] = await context.db
            .insert(userSettingsTable)
            .values({
              userId: context.session.id,
              autoRefreshEnabled: input.autoRefreshEnabled ?? true,
              refreshIntervalHours: input.refreshIntervalHours ?? 24,
              articleRetentionDays: input.articleRetentionDays ?? 30,
              showFilterCountBadges: input.showFilterCountBadges ?? true,
            })
            .returning()

          await context.redis.deleteCache(`user:settings:${context.session.id}`)
          return newSettings
        }

        const [updatedSettings] = await context.db
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
          .where(eq(userSettingsTable.userId, context.session.id))
          .returning()

        await context.redis.deleteCache(`user:settings:${context.session.id}`)
        return updatedSettings
      } catch (error) {
        handleORPCError(error)
      }
    }),

  expireMyArticles: protectedProcedure.handler(async ({ context }) => {
    try {
      const settings = await context.db.query.userSettingsTable.findFirst({
        where: eq(userSettingsTable.userId, context.session.id),
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

      const expiredArticles = await context.db
        .update(articleTable)
        .set({
          status: "expired",
          updatedAt: now,
        })
        .where(
          and(
            eq(articleTable.userId, context.session.id),
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
      handleORPCError(error)
    }
  }),
}
