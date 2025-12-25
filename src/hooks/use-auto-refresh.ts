"use client"

import { useEffect } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"

import type { SelectUserSettings } from "@/lib/db/schema/user-settings"
import { queryApi } from "@/lib/orpc/query"

/**
 * Automatically refreshes stale feeds on component mount
 *
 * This hook:
 * - Fetches user settings to determine refresh preferences
 * - Triggers auto-refresh for stale feeds if auto-refresh is enabled
 * - Respects the user's configured refresh interval
 * - Runs silently without user interaction
 * - Bypasses rate limiting (uses autoRefresh instead of refreshAll)
 */
export function useAutoRefresh() {
  const { data: settings } = useQuery(
    queryApi.user.getSettings.queryOptions(),
  ) as {
    data: SelectUserSettings | undefined
  }

  const autoRefresh = useMutation(queryApi.feed.autoRefresh.mutationOptions())

  useEffect(() => {
    if (!settings?.autoRefreshEnabled) return

    autoRefresh.mutate(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.autoRefreshEnabled])

  return {
    isRefreshing: autoRefresh.isPending,
  }
}
