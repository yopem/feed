import { eq } from "drizzle-orm"
import z from "zod"

import { handleTRPCError } from "@/lib/api/error"
import { createTRPCRouter, protectedProcedure } from "@/lib/api/trpc"
import { userSettingsTable } from "@/lib/db/schema"

/**
 * User management router providing operations for user profile and settings
 */
export const userRouter = createTRPCRouter({
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
   * Get user settings for auto-refresh configuration
   *
   * If settings don't exist yet, creates them with default values
   * (autoRefreshEnabled: true, refreshIntervalHours: 24)
   *
   * @returns User settings with auto-refresh preferences
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
   * Update user settings for auto-refresh configuration
   *
   * @param autoRefreshEnabled - Enable/disable automatic feed refresh
   * @param refreshIntervalHours - Hours between automatic refreshes (1-168)
   * @returns Updated user settings
   * @throws TRPCError if settings not found
   */
  updateSettings: protectedProcedure
    .input(
      z.object({
        autoRefreshEnabled: z.boolean().optional(),
        refreshIntervalHours: z.number().min(1).max(168).optional(),
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
})
