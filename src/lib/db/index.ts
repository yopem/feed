import { drizzle } from "drizzle-orm/node-postgres"

import * as schema from "@/lib/db/schema"
import { databaseUrl } from "@/lib/env/server"

export const db = drizzle(databaseUrl, {
  schema,
})
