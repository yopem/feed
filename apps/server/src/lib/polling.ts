import { fetchFeed } from "server/lib/rss"

import { pollingFeeds, refreshStoredFeed } from "db/services/feeds"
import { env } from "env/server"

export function startFeedPolling() {
  let stopped = false
  let timer: ReturnType<typeof setTimeout> | undefined

  async function poll() {
    try {
      for (const feed of await pollingFeeds()) {
        if (stopped) break

        if (
          !feed.lastFetchedAt ||
          Date.now() - feed.lastFetchedAt.getTime() >=
            env.FEED_REFRESH_MINUTES * 60_000
        ) {
          await refreshStoredFeed(feed, fetchFeed)
        }
      }
    } catch {
      console.error("Feed polling failed")
    } finally {
      if (!stopped) timer = setTimeout(() => void poll(), 60_000)
    }
  }

  timer = setTimeout(() => void poll(), 1000)

  return function stop() {
    stopped = true
    clearTimeout(timer)
  }
}
