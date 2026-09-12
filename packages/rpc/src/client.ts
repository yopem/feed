import type { oauth } from "server/handlers/oauth"
import type { AppType } from "server/index"

import { hc } from "hono/client"

import { clientEnv } from "env/client"

export const client = hc<AppType>(clientEnv.VITE_SERVER_URL, {
  init: { credentials: "include" },
})

export const authClient = hc<typeof oauth>(
  new URL("/auth", clientEnv.VITE_SERVER_URL).href,
  { init: { credentials: "include" } },
)
