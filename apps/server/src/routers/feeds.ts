import type { AuthContext } from "server/middleware/auth"

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { HTTPException } from "hono/http-exception"
import { fetchFeed, validateFeedUrl } from "server/lib/rss"
import {
  feedInput,
  feedSchema,
  jsonBody,
  okSchema,
  responses,
  validationHook,
  workspaceInput,
} from "server/routers/schemas"

import {
  addFeed,
  getFeed,
  listFeeds,
  refreshStoredFeed,
  removeFeed,
} from "db/services/feeds"

export const feedRouter = new OpenAPIHono<AuthContext>({
  defaultHook: validationHook,
})
  .openapi(
    createRoute({
      method: "get",
      path: "/feed/list",
      request: { query: workspaceInput },
      responses: responses(z.object({ feeds: z.array(feedSchema) })),
    }),
    async (c) => {
      const feeds = await listFeeds(
        c.var.user.id,
        c.req.valid("query").workspaceId,
      )
      return c.json(
        {
          feeds: feeds.map((feed) => ({
            ...feed,
            lastFetchedAt: feed.lastFetchedAt?.toISOString() ?? null,
          })),
        },
        200,
      )
    },
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/feed/add",
      request: {
        body: jsonBody(workspaceInput.extend({ url: z.url().max(2048) })),
      },
      responses: responses(z.object({ feed: feedSchema })),
    }),
    async (c) => {
      const input = c.req.valid("json")
      let url
      try {
        url = validateFeedUrl(input.url)
      } catch {
        throw new HTTPException(400, { message: "Invalid feed URL" })
      }
      const feed = await addFeed(c.var.user.id, input.workspaceId, url.href)
      await refreshStoredFeed(feed, fetchFeed)
      const updated = await getFeed(c.var.user.id, input.workspaceId, feed.id)
      return c.json(
        {
          feed: {
            ...updated,
            lastFetchedAt: updated.lastFetchedAt?.toISOString() ?? null,
          },
        },
        200,
      )
    },
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/feed/remove",
      request: { body: jsonBody(feedInput) },
      responses: responses(okSchema),
    }),
    async (c) => {
      const input = c.req.valid("json")
      await removeFeed(c.var.user.id, input.workspaceId, input.feedId)
      return c.json({ ok: true as const }, 200)
    },
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/feed/refresh",
      request: { body: jsonBody(feedInput) },
      responses: responses(okSchema),
    }),
    async (c) => {
      const input = c.req.valid("json")
      const feed = await getFeed(c.var.user.id, input.workspaceId, input.feedId)
      await refreshStoredFeed(feed, fetchFeed)
      return c.json({ ok: true as const }, 200)
    },
  )
