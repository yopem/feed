import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "@/lib/db/schema"
import { databaseUrl } from "@/lib/env/server"

const pool = new Pool({
  connectionString: databaseUrl,
})

export const db = drizzle(pool, {
  schema,
})
