import { createClient } from "@openauthjs/openauth/client"

import { authIssuer } from "@/lib/env/server"

export const authClient = createClient({
  clientID: "yopem-read",
  issuer: authIssuer,
})
