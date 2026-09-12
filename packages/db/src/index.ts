import { SQL } from "bun"
import { drizzle } from "drizzle-orm/bun-sql"

import { env } from "env/server"

export const db = drizzle(new SQL(env.DATABASE_URL), { casing: "snake_case" })
