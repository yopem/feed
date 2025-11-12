"use client"

import { useEffect } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"

import type { SelectUserSettings } from "@/lib/db/schema/userSettings"
import { useTRPC } from "@/lib/trpc/client"

/**
 * Automatically refreshes all feeds on component mount if they haven't been
 * refreshed within the user's configured refresh interval
 *
 * This hook:
 * - Fetches user settings to determine refresh preferences
 * - Triggers feed refresh if auto-refresh is enabled
 * - Respects the user's configured refresh interval
 * - Runs silently without user interaction
 */
export function useAutoRefresh() {
  const trpc = useTRPC()

  const { data: settings } = useQuery(trpc.user.getSettings.queryOptions()) as {
    data: SelectUserSettings | undefined
  }

  const refreshAll = useMutation(
    trpc.feed.refreshAll.mutationOptions({
      onError: () => {},
    }),
  )

  useEffect(() => {
    if (!settings || !settings.autoRefreshEnabled) return

    refreshAll.mutate(undefined, {
      onError: () => {},
    })
  }, [settings])

  return {
    isRefreshing: refreshAll.isPending,
  }
}
