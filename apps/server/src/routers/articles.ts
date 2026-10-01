import type { AuthContext } from "server/middleware/auth"

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import {
  articleSchema,
  id,
  jsonBody,
  okSchema,
  responses,
  validationHook,
  workspaceInput,
} from "server/routers/schemas"

import { listArticles, setArticleState } from "db/services/articles"

export const articleRouter = new OpenAPIHono<AuthContext>({
  defaultHook: validationHook,
})
  .openapi(
    createRoute({
      method: "get",
      path: "/article/list",
      request: {
        query: workspaceInput.extend({
          feedId: id.optional(),
          view: z.enum(["all", "unread", "starred", "saved"]).optional(),
          search: z.string().trim().max(200).optional(),
        }),
      },
      responses: responses(z.object({ articles: z.array(articleSchema) })),
    }),
    async (c) => {
      const articles = await listArticles(c.var.user.id, c.req.valid("query"))

      return c.json(
        {
          articles: articles.map((article) => ({
            ...article,
            publishedAt: article.publishedAt?.toISOString() ?? null,
          })),
        },
        200,
      )
    },
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/article/state",
      request: {
        body: jsonBody(
          workspaceInput.extend({
            articleId: id,
            read: z.boolean().optional(),
            starred: z.boolean().optional(),
            saved: z.boolean().optional(),
          }),
        ),
      },
      responses: responses(okSchema),
    }),
    async (c) => {
      await setArticleState(c.var.user.id, c.req.valid("json"))

      return c.json({ ok: true as const }, 200)
    },
  )
