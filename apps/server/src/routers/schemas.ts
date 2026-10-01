import type { Context } from "hono"

import { z } from "@hono/zod-openapi"

export function validationHook(result: { success: boolean }, c: Context) {
  if (!result.success) return c.json({ error: "Invalid request" }, 400)
}

export const id = z.string().uuid()

export const workspaceInput = z.object({ workspaceId: id })

export const feedInput = workspaceInput.extend({ feedId: id })

export const workspaceSchema = z.object({
  id,
  name: z.string(),
  role: z.enum(["owner", "editor", "viewer"]),
})

export const feedSchema = z.object({
  id,
  title: z.string(),
  url: z.string(),
  lastFetchedAt: z.string().nullable(),
  error: z.string().nullable(),
})

export const articleSchema = z.object({
  id,
  feedId: id,
  feedTitle: z.string(),
  title: z.string(),
  url: z.string(),
  content: z.string(),
  publishedAt: z.string().nullable(),
  read: z.boolean(),
  starred: z.boolean(),
  saved: z.boolean(),
})

export const okSchema = z.object({ ok: z.literal(true) })

export function jsonBody<T extends z.ZodType>(schema: T) {
  return { required: true, content: { "application/json": { schema } } }
}

export function responses<T extends z.ZodType>(schema: T) {
  const error = {
    description: "Request failed",
    content: {
      "application/json": { schema: z.object({ error: z.string() }) },
    },
  }

  return {
    200: {
      description: "Success",
      content: { "application/json": { schema } },
    },
    400: error,
    401: error,
    403: error,
    404: error,
    409: error,
    500: error,
  }
}
