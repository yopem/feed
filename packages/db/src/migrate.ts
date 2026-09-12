import "zod/compile"
import { migrate } from "drizzle-orm/bun-sql/migrator"
import { fileURLToPath } from "node:url"

import { db } from "db/index"

try {
  await migrate(db, {
    migrationsFolder: fileURLToPath(new URL("./migrations", import.meta.url)),
  })
  console.info("Database migrations applied")
} finally {
  await db.$client.close()
}
