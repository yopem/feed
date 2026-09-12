import { createClient } from "@openauthjs/openauth/client"

import { env } from "env/server"

export const callbackUrl = env.AUTH_CALLBACK_URL
export const authClient = createClient({
  clientID: env.AUTH_CLIENT_ID,
  issuer: env.AUTH_ISSUER,
})
