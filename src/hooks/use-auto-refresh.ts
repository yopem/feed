"use client"

import { useEffect } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"

import type { SelectUserSettings } from "@/lib/db/schema/user-settings"
import { queryApi } from "@/lib/orpc/query"

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
