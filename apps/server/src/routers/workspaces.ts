import type { AuthContext } from "server/middleware/auth"

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import {
  jsonBody,
  responses,
  validationHook,
  workspaceSchema,
} from "server/routers/schemas"

import { createWorkspace, listWorkspaces } from "db/services/workspaces"

export const workspaceRouter = new OpenAPIHono<AuthContext>({
  defaultHook: validationHook,
})
  .openapi(
    createRoute({
      method: "get",
      path: "/workspace/list",
      responses: responses(z.object({ workspaces: z.array(workspaceSchema) })),
    }),
    async (c) => {
      return c.json({ workspaces: await listWorkspaces(c.var.user.id) }, 200)
    },
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/workspace/create",
      request: {
        body: jsonBody(z.object({ name: z.string().trim().min(1).max(100) })),
      },
      responses: responses(z.object({ workspace: workspaceSchema })),
    }),
    async (c) => {
      return c.json(
        {
          workspace: await createWorkspace(
            c.var.user.id,
            c.req.valid("json").name,
          ),
        },
        200,
      )
    },
  )
