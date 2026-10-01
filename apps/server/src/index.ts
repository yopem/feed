import "zod/compile"
import type { AuthContext } from "server/middleware/auth"

import { swaggerUI } from "@hono/swagger-ui"
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { bodyLimit } from "hono/body-limit"
import { cors } from "hono/cors"
import { HTTPException } from "hono/http-exception"
import { secureHeaders } from "hono/secure-headers"
import { oauth } from "server/handlers/oauth"
import { startFeedPolling } from "server/lib/polling"
import { trustedOrigin } from "server/lib/security"
import { requireAuth, sessionUser } from "server/middleware/auth"
import { articleRouter } from "server/routers/articles"
import { feedRouter } from "server/routers/feeds"
import { responses } from "server/routers/schemas"
import { workspaceRouter } from "server/routers/workspaces"

import { ServiceError } from "db/services/access"
import { env } from "env/server"

const server = new OpenAPIHono<AuthContext>()

server.use("*", secureHeaders())

server.use(
  "*",
  cors({
    origin: new URL(env.WEB_URL).origin,
    credentials: true,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
)

server.use("*", async (c, next) => {
  c.header("Cache-Control", "no-store")

  if (
    (c.req.path.startsWith("/rpc/") || c.req.path === "/auth/logout") &&
    !["GET", "HEAD", "OPTIONS"].includes(c.req.method) &&
    !trustedOrigin(c.req.header("Origin"), env.WEB_URL)
  ) {
    return c.json({ error: "Untrusted origin" }, 403)
  }

  await next()
  c.header(
    "Access-Control-Allow-Origin",
    trustedOrigin(c.req.header("Origin"), env.WEB_URL)
      ? new URL(env.WEB_URL).origin
      : undefined,
  )
})

server.use(
  "/rpc/*",
  bodyLimit({
    maxSize: 16_384,
    onError: (c) => c.json({ error: "Request too large" }, 413),
  }),
)

server.onError((error, c) => {
  if (error instanceof ServiceError)
    return c.json({ error: error.message }, error.status)

  if (error instanceof HTTPException)
    return c.json(
      { error: error.status < 500 ? error.message : "Request failed" },
      error.status,
    )
  console.error("Request failed", error.name)

  return c.json({ error: "Internal server error" }, 500)
})

server.notFound((c) => c.json({ error: "Not found" }, 404))

server.get("/health", (c) => c.json({ ok: true }))

server.route("/auth", oauth)

const publicRoutes = server.openapi(
  createRoute({
    method: "get",
    path: "/rpc/session",
    responses: responses(
      z.object({
        user: z
          .object({ id: z.string(), name: z.string(), email: z.string() })
          .nullable(),
      }),
    ),
  }),
  async (c) => c.json({ user: await sessionUser(c) }, 200),
)

if (env.OPENAPI_ENABLED) {
  server.doc("/rpc/spec.json", {
    openapi: "3.0.0",
    info: { title: "Feed API", version: "1.0.0" },
  })
  server.get("/rpc/doc", swaggerUI({ url: "/rpc/spec.json" }))
}

export const app = publicRoutes
  .use("/rpc/*", requireAuth)
  .route("/rpc", workspaceRouter)
  .route("/rpc", feedRouter)
  .route("/rpc", articleRouter)

export type AppType = typeof app

if (import.meta.main) {
  const listener = Bun.serve({ port: env.SERVER_PORT, fetch: app.fetch })
  const stopPolling = startFeedPolling()

  function shutdown() {
    stopPolling()
    void listener.stop()
  }

  process.once("SIGTERM", shutdown)
  process.once("SIGINT", shutdown)
}
